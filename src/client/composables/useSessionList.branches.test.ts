/**
 * Branch coverage tests for useSessionList composable — line 89.
 *
 * Lines targeted:
 *   89 — fetchSessions catch: `err instanceof Error ? err.message : 'Failed to load sessions'`
 *        The false branch fires when fetch rejects with a non-Error value (e.g. a string).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSessionList } from './useSessionList.js';

describe('useSessionList() — fetchSessions: non-Error catch branch (line 89)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sets generic error message when fetch rejects with a non-Error value', async () => {
    vi.mocked(fetch).mockRejectedValue('unexpected string rejection');

    const { error, fetchSessions } = useSessionList();
    await fetchSessions();

    // The false branch: err is not instanceof Error → uses fallback message
    expect(error.value).toBe('Failed to load sessions');
  });
});
