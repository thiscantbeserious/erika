/**
 * Composable for subscribing to SSE pipeline events for processing sessions.
 *
 * Opens an EventSource per session whose detection_status is not terminal
 * (completed or failed). Uses named addEventListener per pipeline event type
 * — NOT onmessage — because the server sends named SSE events.
 *
 * Exposes connectionStates as a shallowRef<Map> that is replaced on each
 * mutation to trigger Vue reactivity (Map mutations are not deeply tracked).
 */

import { watch, onUnmounted, shallowRef } from 'vue';
import type { Ref, ShallowRef } from 'vue';
import type { Session } from '../../shared/types/session';
import type { PipelineEvent } from '../../shared/types/pipeline';
import { ALL_PIPELINE_EVENT_TYPES } from '../../shared/types/pipeline';

/** Per-session SSE connection health. */
export type SseConnectionState = 'connecting' | 'connected' | 'disconnected';

/** Return shape of useSessionSSE. */
export interface UseSessionSSEReturn {
  connectionStates: Readonly<ShallowRef<Map<string, SseConnectionState>>>;
}

/** Terminal detection statuses — no SSE connection needed. */
const TERMINAL_STATUSES = new Set(['completed', 'failed']);

/** EventSource readyState constants. */
const CONNECTING = 0;
const CLOSED = 2;

/**
 * Maps a PipelineEvent to a partial Session patch.
 * Returns null for event types that carry no relevant session patch.
 */
function mapEventToPatch(event: PipelineEvent): Partial<Session> | null {
  switch (event.type) {
    case 'session.ready':
      return { detection_status: 'completed' };
    case 'session.failed':
      return { detection_status: 'failed' };
    case 'session.retrying':
      return { detection_status: 'processing' };
    case 'session.detected':
      return { detected_sections_count: event.sectionCount, detection_status: 'detecting' };
    case 'session.validated':
      return { detection_status: 'validating' };
    case 'session.replayed':
      return { detection_status: 'replaying' };
    case 'session.deduped':
      return { detection_status: 'deduplicating' };
    default:
      return null;
  }
}

/** Returns true if the event type causes the SSE stream to end. */
function isTerminalEvent(type: string): boolean {
  return type === 'session.ready' || type === 'session.failed';
}

/**
 * Sets a new state for a session in the connectionStates map.
 * Creates a new Map instance to trigger shallowRef Vue reactivity.
 */
function setConnectionState(
  statesRef: ShallowRef<Map<string, SseConnectionState>>,
  id: string,
  state: SseConnectionState,
): void {
  const next = new Map(statesRef.value);
  next.set(id, state);
  statesRef.value = next;
}

/**
 * Removes a session entry from the connectionStates map.
 * Creates a new Map instance to trigger shallowRef Vue reactivity.
 */
function removeConnectionState(
  statesRef: ShallowRef<Map<string, SseConnectionState>>,
  id: string,
): void {
  const next = new Map(statesRef.value);
  next.delete(id);
  statesRef.value = next;
}

/**
 * Builds and opens an EventSource for the given session id.
 * Registers named event listeners for all pipeline event types.
 * Returns the EventSource so the caller can close it later.
 */
function openEventSource(
  id: string,
  updateSession: (id: string, patch: Partial<Session>) => void,
  statesRef: ShallowRef<Map<string, SseConnectionState>>,
): EventSource {
  const es = new EventSource(`/api/sessions/${id}/events`);
  setConnectionState(statesRef, id, 'connecting');

  es.onopen = () => {
    setConnectionState(statesRef, id, 'connected');
  };

  es.onerror = () => {
    if (es.readyState === CONNECTING) {
      setConnectionState(statesRef, id, 'connecting');
    } else if (es.readyState === CLOSED) {
      setConnectionState(statesRef, id, 'disconnected');
    }
  };

  for (const eventType of ALL_PIPELINE_EVENT_TYPES) {
    es.addEventListener(eventType, (e: MessageEvent) => {
      const event = JSON.parse(e.data as string) as PipelineEvent;
      const patch = mapEventToPatch(event);
      if (patch !== null) {
        updateSession(id, patch);
      }
      if (isTerminalEvent(eventType)) {
        es.close();
        removeConnectionState(statesRef, id);
      }
    });
  }

  return es;
}

/**
 * Subscribes to SSE pipeline events for all active (non-terminal) sessions.
 *
 * Watches the sessions list reactively — new processing sessions are
 * subscribed automatically; removed sessions are unsubscribed. All
 * connections are closed on component unmount.
 *
 * @param sessions - Reactive list of sessions to monitor.
 * @param updateSession - Callback invoked with a partial session patch when events arrive.
 * @param onUnmountedHook - Optional override for onUnmounted (used in tests to inject lifecycle).
 */
export function useSessionSSE(
  sessions: Ref<Session[]>,
  updateSession: (id: string, patch: Partial<Session>) => void,
  onUnmountedHook: (fn: () => void) => void = onUnmounted,
): UseSessionSSEReturn {
  const connectionStates = shallowRef<Map<string, SseConnectionState>>(new Map());
  const connections = new Map<string, EventSource>();

  /** Opens a connection for a session that does not yet have one. */
  function subscribe(session: Session): void {
    if (connections.has(session.id)) return;
    if (TERMINAL_STATUSES.has(session.detection_status ?? '')) return;
    const es = openEventSource(session.id, updateSession, connectionStates);
    connections.set(session.id, es);
  }

  /** Closes and removes a connection for a session id. */
  function unsubscribe(id: string): void {
    const es = connections.get(id);
    if (!es) return;
    es.close();
    connections.delete(id);
    removeConnectionState(connectionStates, id);
  }

  /** Reconcile connections against current session list. */
  function reconcile(current: Session[]): void {
    const activeIds = new Set(current.map((s) => s.id));

    // Close connections for sessions no longer in the list
    for (const id of connections.keys()) {
      if (!activeIds.has(id)) unsubscribe(id);
    }

    // Open connections for new processing sessions
    for (const session of current) {
      subscribe(session);
    }
  }

  watch(sessions, (current) => reconcile(current), { immediate: true });

  onUnmountedHook(() => {
    for (const id of [...connections.keys()]) {
      unsubscribe(id);
    }
  });

  return { connectionStates };
}
