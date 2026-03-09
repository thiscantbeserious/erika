/**
 * SseService: event replay (Last-Event-ID) and live subscription helpers.
 *
 * Registers per-session event bus handlers for buffered live delivery,
 * and queries the event log for missed events on reconnect.
 *
 * Connections: EventLogAdapter (events/), EventBusAdapter (events/).
 */

import type { EventBusAdapter, EventHandler } from '../events/event_bus_adapter.js';
import type { EventLogAdapter, EventLogEntry } from '../events/event_log_adapter.js';
import type { PipelineEvent, PipelineEventType } from '../../shared/types/pipeline.js';

/** All pipeline event types to subscribe to. */
export const ALL_PIPELINE_EVENT_TYPES: PipelineEventType[] = [
  'session.uploaded', 'session.validated', 'session.detected',
  'session.replayed', 'session.deduped', 'session.ready',
  'session.failed', 'session.retrying',
];

export interface SseServiceDeps {
  eventBus: EventBusAdapter;
  eventLog: EventLogAdapter;
}

/**
 * SseService manages event bus subscriptions and log queries for SSE streaming.
 */
export class SseService {
  private readonly eventBus: EventBusAdapter;
  private readonly eventLog: EventLogAdapter;

  constructor(deps: SseServiceDeps) {
    this.eventBus = deps.eventBus;
    this.eventLog = deps.eventLog;
  }

  /**
   * Register event bus handlers for a session synchronously, buffering events into pending.
   * Must be called synchronously before any awaits to avoid missing events emitted during
   * async session lookup.
   */
  registerSessionHandlers(
    sessionId: string,
    pending: PipelineEvent[]
  ): Map<PipelineEventType, (event: PipelineEvent) => void> {
    return registerSessionHandlers(this.eventBus, sessionId, pending);
  }

  /** Remove all registered event bus handlers. */
  unregisterSessionHandlers(
    handlers: Map<PipelineEventType, (event: PipelineEvent) => void>
  ): void {
    unregisterSessionHandlers(this.eventBus, handlers);
  }

  /** Returns events from the log with id strictly greater than afterId. */
  async getMissedEvents(sessionId: string, afterId: number): Promise<EventLogEntry[]> {
    return getMissedEvents(this.eventLog, sessionId, afterId);
  }
}

/** Register event bus handlers for a session synchronously, buffering events into pending. */
export function registerSessionHandlers(
  eventBus: EventBusAdapter,
  sessionId: string,
  pending: PipelineEvent[]
): Map<PipelineEventType, (event: PipelineEvent) => void> {
  const handlers = new Map<PipelineEventType, (event: PipelineEvent) => void>();
  for (const type of ALL_PIPELINE_EVENT_TYPES) {
    const handler = (event: PipelineEvent) => {
      if (event.sessionId === sessionId) pending.push(event);
    };
    handlers.set(type, handler);
    eventBus.on(type, handler as EventHandler<typeof type>);
  }
  return handlers;
}

/** Remove all registered event bus handlers. */
export function unregisterSessionHandlers(
  eventBus: EventBusAdapter,
  handlers: Map<PipelineEventType, (event: PipelineEvent) => void>
): void {
  for (const [type, handler] of handlers) {
    eventBus.off(type, handler as EventHandler<typeof type>);
  }
}

/** Returns events from the log with id strictly greater than afterId. */
export async function getMissedEvents(
  eventLog: EventLogAdapter,
  sessionId: string,
  afterId: number
): Promise<EventLogEntry[]> {
  const all = await eventLog.findBySessionId(sessionId);
  return all.filter(e => e.id > afterId);
}
