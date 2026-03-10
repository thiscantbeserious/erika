import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import type { Ref, ShallowRef } from 'vue';
import type { Session } from '../../shared/types/session';
import type { SseConnectionState } from './useSessionSSE';
import { useSessionSSE } from './useSessionSSE';

// ---------------------------------------------------------------------------
// Mock EventSource
// ---------------------------------------------------------------------------

type EventHandler = (event: MessageEvent) => void;

interface MockEventSourceInstance {
  url: string;
  readyState: number;
  onopen: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  listeners: Map<string, EventHandler[]>;
  addEventListener: (type: string, handler: EventHandler) => void;
  close: () => void;
  /** Test helper: simulate a named SSE event with JSON data */
  simulateEvent: (type: string, data: object) => void;
  /** Test helper: simulate open */
  simulateOpen: () => void;
  /** Test helper: simulate error with given readyState */
  simulateError: (readyState: number) => void;
  /** Test helper: close externally (simulates server closing) */
  simulateClosed: () => void;
}

const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 2;

let instances: MockEventSourceInstance[] = [];

class MockEventSource implements MockEventSourceInstance {
  url: string;
  readyState = CONNECTING;
  onopen: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  listeners = new Map<string, EventHandler[]>();

  constructor(url: string) {
    this.url = url;
    instances.push(this);
  }

  addEventListener(type: string, handler: EventHandler) {
    const existing = this.listeners.get(type) ?? [];
    this.listeners.set(type, [...existing, handler]);
  }

  close() {
    this.readyState = CLOSED;
  }

  simulateEvent(type: string, data: object) {
    const handlers = this.listeners.get(type) ?? [];
    const event = { data: JSON.stringify(data) } as unknown as MessageEvent;
    for (const h of handlers) h(event);
  }

  simulateOpen() {
    this.readyState = OPEN;
    this.onopen?.();
  }

  simulateError(readyState: number) {
    this.readyState = readyState;
    this.onerror?.({} as Event);
  }

  simulateClosed() {
    this.readyState = CLOSED;
  }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'abc',
    filename: 'session.cast',
    filepath: '/data/session.cast',
    size_bytes: 1024,
    marker_count: 3,
    uploaded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    detection_status: 'processing',
    ...overrides,
  };
}

// Wrap composable in a minimal lifecycle context to support onUnmounted
function mountComposable(
  sessions: Ref<Session[]>,
  updateSession: (id: string, patch: Partial<Session>) => void,
): { connectionStates: Readonly<ShallowRef<Map<string, SseConnectionState>>>; unmount: () => void } {
  let unmountCallback: (() => void) | undefined;

  const mockOnUnmounted = (fn: () => void) => { unmountCallback = fn; };

  const result = useSessionSSE(sessions, updateSession, mockOnUnmounted);

  return {
    connectionStates: result.connectionStates,
    unmount: () => unmountCallback?.(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSessionSSE', () => {
  beforeEach(() => {
    instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('initial subscription', () => {
    it('opens an EventSource for a session with detection_status processing', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, vi.fn());
      expect(instances).toHaveLength(1);
      expect(instances[0]!.url).toBe('/api/sessions/s1/events');
    });

    it('opens EventSource for every processing-like status except completed and failed', () => {
      const statuses = ['pending', 'queued', 'validating', 'detecting', 'replaying', 'deduplicating', 'storing'] as const;
      for (const status of statuses) {
        instances = [];
        const sessions = ref([makeSession({ id: 's1', detection_status: status })]);
        mountComposable(sessions, vi.fn());
        expect(instances).toHaveLength(1);
      }
    });

    it('does NOT open an EventSource for a completed session', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'completed' })]);
      mountComposable(sessions, vi.fn());
      expect(instances).toHaveLength(0);
    });

    it('does NOT open an EventSource for a failed session', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'failed' })]);
      mountComposable(sessions, vi.fn());
      expect(instances).toHaveLength(0);
    });

    it('opens multiple EventSources for multiple processing sessions', () => {
      const sessions = ref([
        makeSession({ id: 's1', detection_status: 'processing' }),
        makeSession({ id: 's2', detection_status: 'detecting' }),
        makeSession({ id: 's3', detection_status: 'completed' }),
      ]);
      mountComposable(sessions, vi.fn());
      expect(instances).toHaveLength(2);
    });
  });

  describe('event listener registration', () => {
    it('registers addEventListener for each pipeline event type instead of onmessage', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, vi.fn());

      const es = instances[0]!;
      // Must NOT use onmessage
      // Must register named event listeners
      expect(es.listeners.size).toBeGreaterThan(0);
      expect(es.listeners.has('session.ready')).toBe(true);
      expect(es.listeners.has('session.failed')).toBe(true);
      expect(es.listeners.has('session.detected')).toBe(true);
      expect(es.listeners.has('session.retrying')).toBe(true);
    });
  });

  describe('event mapping', () => {
    it('maps session.ready -> updateSession with detection_status completed', () => {
      const updateSession = vi.fn();
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, updateSession);

      instances[0]!.simulateEvent('session.ready', { type: 'session.ready', sessionId: 's1' });

      expect(updateSession).toHaveBeenCalledWith('s1', { detection_status: 'completed' });
    });

    it('maps session.failed -> updateSession with detection_status failed', () => {
      const updateSession = vi.fn();
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, updateSession);

      instances[0]!.simulateEvent('session.failed', {
        type: 'session.failed',
        sessionId: 's1',
        stage: 'detect',
        error: 'oh no',
      });

      expect(updateSession).toHaveBeenCalledWith('s1', { detection_status: 'failed' });
    });

    it('maps session.detected -> updateSession with detected_sections_count and detection_status detecting', () => {
      const updateSession = vi.fn();
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, updateSession);

      instances[0]!.simulateEvent('session.detected', {
        type: 'session.detected',
        sessionId: 's1',
        sectionCount: 5,
      });

      expect(updateSession).toHaveBeenCalledWith('s1', {
        detected_sections_count: 5,
        detection_status: 'detecting',
      });
    });

    it('maps session.retrying -> updateSession with detection_status processing', () => {
      const updateSession = vi.fn();
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, updateSession);

      instances[0]!.simulateEvent('session.retrying', {
        type: 'session.retrying',
        sessionId: 's1',
        stage: 'detect',
        attempt: 1,
      });

      expect(updateSession).toHaveBeenCalledWith('s1', { detection_status: 'processing' });
    });

    it('maps session.validated -> updateSession with detection_status validating', () => {
      const updateSession = vi.fn();
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, updateSession);

      instances[0]!.simulateEvent('session.validated', {
        type: 'session.validated',
        sessionId: 's1',
        eventCount: 100,
      });

      expect(updateSession).toHaveBeenCalledWith('s1', { detection_status: 'validating' });
    });

    it('maps session.replayed -> updateSession with detection_status replaying', () => {
      const updateSession = vi.fn();
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, updateSession);

      instances[0]!.simulateEvent('session.replayed', {
        type: 'session.replayed',
        sessionId: 's1',
        lineCount: 200,
      });

      expect(updateSession).toHaveBeenCalledWith('s1', { detection_status: 'replaying' });
    });

    it('maps session.deduped -> updateSession with detection_status deduplicating', () => {
      const updateSession = vi.fn();
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, updateSession);

      instances[0]!.simulateEvent('session.deduped', {
        type: 'session.deduped',
        sessionId: 's1',
        rawLines: 300,
        cleanLines: 100,
      });

      expect(updateSession).toHaveBeenCalledWith('s1', { detection_status: 'deduplicating' });
    });
  });

  describe('terminal events close the EventSource', () => {
    it('closes EventSource on session.ready', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, vi.fn());

      const es = instances[0]!;
      es.simulateEvent('session.ready', { type: 'session.ready', sessionId: 's1' });

      expect(es.readyState).toBe(CLOSED);
    });

    it('closes EventSource on session.failed', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, vi.fn());

      const es = instances[0]!;
      es.simulateEvent('session.failed', {
        type: 'session.failed',
        sessionId: 's1',
        stage: 'detect',
        error: 'failed',
      });

      expect(es.readyState).toBe(CLOSED);
    });
  });

  describe('connection states', () => {
    it('exposes connectionStates as a shallowRef Map', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      const { connectionStates } = mountComposable(sessions, vi.fn());

      expect(connectionStates.value).toBeInstanceOf(Map);
    });

    it('sets state to connecting on EventSource creation', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      const { connectionStates } = mountComposable(sessions, vi.fn());

      expect(connectionStates.value.get('s1')).toBe('connecting');
    });

    it('sets state to connected on onopen', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      const { connectionStates } = mountComposable(sessions, vi.fn());

      instances[0]!.simulateOpen();

      expect(connectionStates.value.get('s1')).toBe('connected');
    });

    it('sets state to connecting on onerror when readyState is CONNECTING (auto-reconnect)', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      const { connectionStates } = mountComposable(sessions, vi.fn());

      instances[0]!.simulateOpen();
      instances[0]!.simulateError(CONNECTING);

      expect(connectionStates.value.get('s1')).toBe('connecting');
    });

    it('sets state to disconnected on onerror when readyState is CLOSED', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      const { connectionStates } = mountComposable(sessions, vi.fn());

      instances[0]!.simulateError(CLOSED);

      expect(connectionStates.value.get('s1')).toBe('disconnected');
    });

    it('removes connection state entry after terminal event closes EventSource', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      const { connectionStates } = mountComposable(sessions, vi.fn());

      instances[0]!.simulateEvent('session.ready', { type: 'session.ready', sessionId: 's1' });

      expect(connectionStates.value.has('s1')).toBe(false);
    });

    it('creates a new Map instance on each state change (replace-on-mutation reactivity)', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      const { connectionStates } = mountComposable(sessions, vi.fn());

      const mapBefore = connectionStates.value;
      instances[0]!.simulateOpen();
      const mapAfter = connectionStates.value;

      expect(mapAfter).not.toBe(mapBefore);
    });
  });

  describe('cleanup on unmount', () => {
    it('closes all EventSource connections on unmount', () => {
      const sessions = ref([
        makeSession({ id: 's1', detection_status: 'processing' }),
        makeSession({ id: 's2', detection_status: 'detecting' }),
      ]);
      const { unmount } = mountComposable(sessions, vi.fn());

      unmount();

      expect(instances[0]!.readyState).toBe(CLOSED);
      expect(instances[1]!.readyState).toBe(CLOSED);
    });

    it('clears all connection states on unmount', () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      const { connectionStates, unmount } = mountComposable(sessions, vi.fn());

      unmount();

      expect(connectionStates.value.size).toBe(0);
    });
  });

  describe('reactive session watching', () => {
    it('subscribes to a new processing session added to the list', async () => {
      const sessions = ref<Session[]>([]);
      mountComposable(sessions, vi.fn());

      expect(instances).toHaveLength(0);

      sessions.value = [makeSession({ id: 's1', detection_status: 'processing' })];

      // Allow watch to fire
      await vi.waitFor(() => expect(instances).toHaveLength(1));
      expect(instances[0]!.url).toBe('/api/sessions/s1/events');
    });

    it('does not re-subscribe to a session already being tracked', async () => {
      const sessions = ref([makeSession({ id: 's1', detection_status: 'processing' })]);
      mountComposable(sessions, vi.fn());

      expect(instances).toHaveLength(1);

      // Reassign same sessions list — should not open a second connection
      sessions.value = [...sessions.value];
      await vi.waitFor(() => expect(instances).toHaveLength(1));
    });

    it('closes EventSource for a session removed from the list', async () => {
      const sessions = ref([
        makeSession({ id: 's1', detection_status: 'processing' }),
        makeSession({ id: 's2', detection_status: 'detecting' }),
      ]);
      mountComposable(sessions, vi.fn());

      expect(instances).toHaveLength(2);

      // Remove s1 from sessions
      sessions.value = [makeSession({ id: 's2', detection_status: 'detecting' })];

      await vi.waitFor(() => expect(instances[0]!.readyState).toBe(CLOSED));
    });
  });
});
