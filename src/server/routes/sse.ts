/**
 * SSE endpoint for real-time pipeline event streaming.
 *
 * Subscribes to the EventBusAdapter for a single session and streams
 * events as Server-Sent Events. Closes automatically when the session
 * reaches a terminal state (session.ready or session.failed).
 *
 * Supports reconnection via Last-Event-ID header: replays missed events
 * from the EventLogAdapter before switching to live streaming.
 *
 * Connections: SessionAdapter (db/), EventBusAdapter (events/),
 * EventLogAdapter (events/).
 */

import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { SessionAdapter } from '../db/session_adapter.js';
import type { EventBusAdapter } from '../events/event_bus_adapter.js';
import type { EventLogAdapter } from '../events/event_log_adapter.js';
import type { PipelineEvent, PipelineEventType } from '../../shared/pipeline_events.js';
import {
  registerSessionHandlers,
  unregisterSessionHandlers,
  getMissedEvents,
} from '../services/index.js';

/** Terminal event types that close the SSE stream. */
const TERMINAL_TYPES = new Set<PipelineEventType>(['session.ready', 'session.failed']);

/** Keepalive interval in milliseconds. */
const KEEPALIVE_INTERVAL_MS = 30_000;

/** Minimal SSE message shape accepted by streamSSE. */
interface SseMessage {
  id?: string;
  event?: string;
  data: string;
}

/**
 * Handle GET /api/sessions/:id/events — SSE stream of pipeline events.
 * Returns 404 if the session does not exist.
 *
 * NOTE: Event bus handlers are registered synchronously BEFORE any async
 * session lookup to avoid a race condition where events are emitted between
 * the await and the handler registration.
 */
export async function handleSseEvents(
  c: Context,
  sessionRepository: SessionAdapter,
  eventBus: EventBusAdapter,
  eventLog: EventLogAdapter
): Promise<Response> {
  const id = c.req.param('id');

  const pendingLive: PipelineEvent[] = [];
  const handlers = registerSessionHandlers(eventBus, id, pendingLive);

  const session = await sessionRepository.findById(id);
  if (!session) {
    unregisterSessionHandlers(eventBus, handlers);
    return c.json({ error: 'Session not found' }, 404);
  }

  const lastEventId = c.req.header('Last-Event-ID');

  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return streamSSE(c, async (stream) => {
    try {
      if (lastEventId !== undefined) {
        const afterId = parseInt(lastEventId, 10);
        if (!isNaN(afterId)) {
          const missed = await getMissedEvents(eventLog, id, afterId);
          for (const entry of missed) {
            if (stream.closed) { unregisterSessionHandlers(eventBus, handlers); return; }
            await stream.writeSSE({
              id: String(entry.id),
              event: entry.eventType,
              data: entry.payload ?? '{}',
            });
          }
        }
      }

      await drainAndListen(stream, pendingLive, () => unregisterSessionHandlers(eventBus, handlers));
    } catch {
      unregisterSessionHandlers(eventBus, handlers);
    }
  });
}

/**
 * Drain buffered live events and keep listening until terminal state or disconnect.
 * Processes all buffered events first, then polls for more until terminal state.
 */
async function drainAndListen(
  stream: { writeSSE: (msg: SseMessage) => Promise<void>; closed: boolean },
  pending: PipelineEvent[],
  cleanup: () => void
): Promise<void> {
  const keepaliveTimer = setInterval(() => {
    if (stream.closed) {
      clearInterval(keepaliveTimer);
      cleanup();
    }
  }, KEEPALIVE_INTERVAL_MS);

  try {
    while (true) {
      if (stream.closed) break;

      while (pending.length > 0) {
        const event = pending.shift()!;
        if (stream.closed) break;
        await stream.writeSSE({ event: event.type, data: JSON.stringify(event) });
        if (TERMINAL_TYPES.has(event.type)) return;
      }

      if (stream.closed) break;
      await waitForNextEvent(pending, stream);
    }
  } finally {
    clearInterval(keepaliveTimer);
    cleanup();
  }
}

/**
 * Resolves when a new event is pushed into the pending array or the stream closes.
 * Uses short-interval polling to avoid blocking the event loop.
 */
function waitForNextEvent(
  pending: PipelineEvent[],
  stream: { closed: boolean }
): Promise<void> {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (pending.length > 0 || stream.closed) {
        clearInterval(interval);
        resolve();
      }
    }, 5);
  });
}
