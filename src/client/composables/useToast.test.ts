/**
 * Tests for useToast composable — core toast lifecycle.
 *
 * Covers: addToast (creates toast with correct fields, auto-dismiss, legacy numeric arg),
 * removeToast (removes toast, cancels timer), resetToastState (clears all state),
 * updateToast (in-place mutation, timer reset).
 *
 * Aggregation tests live in useToast.aggregation.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useToast, resetToastState } from './useToast.js';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetToastState();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetToastState();
  });

  describe('addToast', () => {
    it('adds a toast to the list with the correct message', () => {
      const { toasts, addToast } = useToast();
      addToast('Upload complete', 'success');
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('Upload complete');
    });

    it('assigns the correct type to the toast', () => {
      const { toasts, addToast } = useToast();
      addToast('Watch out', 'warning');
      expect(toasts.value[0]?.type).toBe('warning');
    });

    it('sets role to "alert" for error toasts', () => {
      const { toasts, addToast } = useToast();
      addToast('Something failed', 'error');
      expect(toasts.value[0]?.role).toBe('alert');
    });

    it('sets role to "status" for non-error toasts', () => {
      const { toasts, addToast } = useToast();
      addToast('All good', 'success');
      expect(toasts.value[0]?.role).toBe('status');
    });

    it('sets the title when provided in options', () => {
      const { toasts, addToast } = useToast();
      addToast('Details here', 'info', { title: 'My Title' });
      expect(toasts.value[0]?.title).toBe('My Title');
    });

    it('sets the icon when provided in options', () => {
      const { toasts, addToast } = useToast();
      addToast('Uploaded', 'success', { icon: 'icon-upload' });
      expect(toasts.value[0]?.icon).toBe('icon-upload');
    });

    it('auto-dismisses the toast after the default duration for success', () => {
      const { toasts, addToast } = useToast();
      addToast('Done', 'success');
      expect(toasts.value).toHaveLength(1);

      vi.advanceTimersByTime(5001);
      expect(toasts.value).toHaveLength(0);
    });

    it('auto-dismisses error toasts after 8 seconds', () => {
      const { toasts, addToast } = useToast();
      addToast('Error', 'error');

      vi.advanceTimersByTime(7999);
      expect(toasts.value).toHaveLength(1);

      vi.advanceTimersByTime(2);
      expect(toasts.value).toHaveLength(0);
    });

    it('supports legacy numeric third argument as durationMs', () => {
      const { toasts, addToast } = useToast();
      addToast('Custom duration', 'info', 1000);

      vi.advanceTimersByTime(999);
      expect(toasts.value).toHaveLength(1);

      vi.advanceTimersByTime(2);
      expect(toasts.value).toHaveLength(0);
    });

    it('assigns unique ids to multiple toasts', () => {
      const { toasts, addToast } = useToast();
      addToast('First', 'info');
      addToast('Second', 'info');
      const ids = toasts.value.map((t) => t.id);
      expect(new Set(ids).size).toBe(2);
    });

    it('does not auto-dismiss when durationMs is 0', () => {
      const { toasts, addToast } = useToast();
      addToast('Sticky', 'info', { durationMs: 0 });

      vi.advanceTimersByTime(60_000);
      expect(toasts.value).toHaveLength(1);
    });

    it('returns the toast id', () => {
      const { addToast } = useToast();
      const id = addToast('Hello', 'info');
      expect(typeof id).toBe('number');
    });

    it('returns incrementing ids for multiple toasts', () => {
      const { addToast } = useToast();
      const id1 = addToast('First', 'info');
      const id2 = addToast('Second', 'info');
      expect(id2).toBeGreaterThan(id1);
    });
  });

  describe('removeToast', () => {
    it('removes the toast with the given id', () => {
      const { toasts, addToast, removeToast } = useToast();
      addToast('To remove', 'info');
      const id = toasts.value[0]!.id;

      removeToast(id);
      expect(toasts.value).toHaveLength(0);
    });

    it('cancels the auto-dismiss timer when toast is manually removed', () => {
      const { toasts, addToast, removeToast } = useToast();
      addToast('Manual dismiss', 'success');
      const id = toasts.value[0]!.id;

      removeToast(id);

      // Advance past the default timer — toast should not re-appear or throw
      vi.advanceTimersByTime(10_000);
      expect(toasts.value).toHaveLength(0);
    });

    it('does not throw when removing a non-existent id', () => {
      const { removeToast } = useToast();
      expect(() => removeToast(999)).not.toThrow();
    });

    it('only removes the targeted toast, leaving others intact', () => {
      const { toasts, addToast, removeToast } = useToast();
      addToast('Keep me', 'info');
      addToast('Remove me', 'info');

      const removeId = toasts.value[1]!.id;
      removeToast(removeId);

      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('Keep me');
    });
  });

  describe('resetToastState', () => {
    it('clears all toasts', () => {
      const { toasts, addToast } = useToast();
      addToast('One', 'info');
      addToast('Two', 'info');

      resetToastState();
      expect(toasts.value).toHaveLength(0);
    });

    it('cancels all pending auto-dismiss timers', () => {
      const { toasts, addToast } = useToast();
      addToast('Will be cleared', 'success');

      resetToastState();

      // Advancing timers after reset should not re-add toasts
      vi.advanceTimersByTime(10_000);
      expect(toasts.value).toHaveLength(0);
    });

    it('clears the activeKeys aggregation map', async () => {
      const { addToast, removeToast, toasts } = useToast();
      // Add a titled toast to populate activeKeys
      const id = addToast('Item uploaded', 'success', { title: 'Session uploaded' });
      expect(toasts.value).toHaveLength(1);

      resetToastState();

      // After reset, a new titled toast should be a fresh entry (count=1, not aggregated)
      addToast('Item uploaded', 'success', { title: 'Session uploaded' });
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('Item uploaded');

      // Suppress unused variable warning
      void id;
      void removeToast;
    });
  });

  describe('updateToast', () => {
    it('changes the message of an existing toast', () => {
      const { toasts, addToast, updateToast } = useToast();
      const id = addToast('Original', 'info');
      updateToast(id, { message: 'Updated' });
      expect(toasts.value[0]?.message).toBe('Updated');
    });

    it('changes the title of an existing toast', () => {
      const { toasts, addToast, updateToast } = useToast();
      const id = addToast('Msg', 'info', { title: 'Old Title' });
      updateToast(id, { title: 'New Title' });
      expect(toasts.value[0]?.title).toBe('New Title');
    });

    it('changes the icon of an existing toast', () => {
      const { toasts, addToast, updateToast } = useToast();
      const id = addToast('Msg', 'info', { icon: 'icon-old' });
      updateToast(id, { icon: 'icon-new' });
      expect(toasts.value[0]?.icon).toBe('icon-new');
    });

    it('returns true for an existing toast', () => {
      const { addToast, updateToast } = useToast();
      const id = addToast('Msg', 'info');
      expect(updateToast(id, { message: 'Updated' })).toBe(true);
    });

    it('returns false for a non-existent id (no-op)', () => {
      const { updateToast } = useToast();
      expect(updateToast(999, { message: 'Does not exist' })).toBe(false);
    });

    it('resets the auto-dismiss timer on update', () => {
      const { toasts, addToast, updateToast } = useToast();
      const id = addToast('Msg', 'success'); // 5000ms default

      // Advance most of the original window
      vi.advanceTimersByTime(4000);
      expect(toasts.value).toHaveLength(1);

      // Update the toast — timer resets to full 5000ms
      updateToast(id, { message: 'Updated' });

      // Original window expired (was at 4000ms, only 1001ms remain on old timer)
      vi.advanceTimersByTime(4500);
      // Should still be visible (new 5000ms window has ~500ms left)
      expect(toasts.value).toHaveLength(1);

      // Advance past the new full window
      vi.advanceTimersByTime(1000);
      expect(toasts.value).toHaveLength(0);
    });
  });

});
