/**
 * Branch coverage tests for useToast composable — line 67.
 *
 * Lines targeted:
 *   67 — `const icon = typeof opts === 'object' ? opts.icon : undefined;`
 *        The true branch: opts is an object (normal options path), icon extracted.
 *        The false branch is unreachable with typed inputs (opts is always an object).
 *        This test ensures the true branch is covered when opts has no icon property.
 *
 * Also covers the auto-dismiss timer path (ToastContainer line 119) indirectly
 * since useToast drives the timer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useToast, resetToastState } from './useToast.js';

describe('useToast — icon extraction from options (line 67)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetToastState();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetToastState();
  });

  it('sets icon to undefined when options object has no icon property', () => {
    const { toasts, addToast } = useToast();
    // opts is an object with durationMs but no icon
    addToast('Test message', 'info', { durationMs: 5000 });
    expect(toasts.value[0]?.icon).toBeUndefined();
  });

  it('sets icon from options object when icon property is present', () => {
    const { toasts, addToast } = useToast();
    addToast('Test message', 'success', { icon: 'icon-check', durationMs: 5000 });
    expect(toasts.value[0]?.icon).toBe('icon-check');
  });

  it('auto-dismiss timer fires and removes toast after duration', () => {
    const { toasts, addToast } = useToast();
    addToast('Timed toast', 'info', { durationMs: 3000 });
    expect(toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(3001);
    expect(toasts.value).toHaveLength(0);
  });

  it('addToast with numeric legacy arg still produces object opts and sets icon to undefined', () => {
    const { toasts, addToast } = useToast();
    // Legacy numeric third argument: opts becomes { durationMs: 2000 }
    // typeof opts === 'object' → true, opts.icon → undefined
    addToast('Legacy call', 'warning', 2000);
    expect(toasts.value[0]?.icon).toBeUndefined();

    vi.advanceTimersByTime(2001);
    expect(toasts.value).toHaveLength(0);
  });
});
