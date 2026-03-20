/**
 * Aggregation tests for useToast composable.
 *
 * Covers: titled toasts merge into a single updating toast,
 * titleless toasts bypass aggregation, cleanup after dismiss,
 * updateToast fallback when toast disappears mid-burst.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { useToast, resetToastState } from './useToast.js';

describe('useToast aggregation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetToastState();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetToastState();
  });

  describe('titled toasts', () => {
    it('first titled toast is created normally and returns an ID', () => {
      const { toasts, addToast } = useToast();
      const id = addToast('File uploaded', 'success', { title: 'Session uploaded' });
      expect(toasts.value).toHaveLength(1);
      expect(typeof id).toBe('number');
    });

    it('second toast with same title+type updates existing toast in place (count=2)', () => {
      const { toasts, addToast } = useToast();
      addToast('file1.cast uploaded', 'success', {
        title: 'Session uploaded',
        itemLabel: 'file1.cast',
        summaryTemplate: (count) => `${count} sessions uploaded`,
      });
      addToast('file2.cast uploaded', 'success', {
        title: 'Session uploaded',
        itemLabel: 'file2.cast',
        summaryTemplate: (count) => `${count} sessions uploaded`,
      });
      // Only one toast in the list
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('2 sessions uploaded');
    });

    it('returns the same ID for subsequent toasts of same title+type', () => {
      const { addToast } = useToast();
      const id1 = addToast('file1.cast', 'success', { title: 'Session uploaded' });
      const id2 = addToast('file2.cast', 'success', { title: 'Session uploaded' });
      expect(id1).toBe(id2);
    });

    it('third toast with same key updates to count=3', () => {
      const { toasts, addToast } = useToast();
      const template = (count: number) => `${count} sessions uploaded`;
      addToast('f1', 'success', { title: 'Session uploaded', summaryTemplate: template });
      addToast('f2', 'success', { title: 'Session uploaded', summaryTemplate: template });
      addToast('f3', 'success', { title: 'Session uploaded', summaryTemplate: template });
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('3 sessions uploaded');
    });

    it('summaryTemplate receives (count, itemLabels, messages)', () => {
      const { addToast } = useToast();
      const captured: { count: number; labels: string[]; messages: string[] }[] = [];
      const template = (count: number, labels: string[], messages: string[]) => {
        captured.push({ count, labels, messages });
        return `${count} items`;
      };
      addToast('msg1', 'success', { title: 'Upload', itemLabel: 'a.cast', summaryTemplate: template });
      addToast('msg2', 'success', { title: 'Upload', itemLabel: 'b.cast', summaryTemplate: template });

      expect(captured).toHaveLength(1); // Only called on second+ toasts
      expect(captured[0]?.count).toBe(2);
      expect(captured[0]?.labels).toEqual(['a.cast', 'b.cast']);
      expect(captured[0]?.messages).toEqual(['msg1', 'msg2']);
    });

    it('uses default "{N} notifications" summary when no summaryTemplate provided', () => {
      const { toasts, addToast } = useToast();
      addToast('First', 'success', { title: 'Upload' });
      addToast('Second', 'success', { title: 'Upload' });
      expect(toasts.value[0]?.message).toBe('2 notifications');
    });

    it('same title but different type creates separate toasts (not merged)', () => {
      const { toasts, addToast } = useToast();
      addToast('msg1', 'success', { title: 'Upload' });
      addToast('msg2', 'error', { title: 'Upload' });
      expect(toasts.value).toHaveLength(2);
    });

    it('same type but different titles creates separate toasts (not merged)', () => {
      const { toasts, addToast } = useToast();
      addToast('msg1', 'success', { title: 'Session uploaded' });
      addToast('msg2', 'success', { title: 'Session ready' });
      expect(toasts.value).toHaveLength(2);
    });

    it('preserves the original toast icon on aggregation update', () => {
      const { toasts, addToast } = useToast();
      addToast('f1', 'success', { title: 'Upload', icon: 'icon-file' });
      addToast('f2', 'success', { title: 'Upload' });
      expect(toasts.value[0]?.icon).toBe('icon-file');
    });

    it('preserves the original toast title on aggregation update', () => {
      const { toasts, addToast } = useToast();
      addToast('f1', 'success', { title: 'Session uploaded' });
      addToast('f2', 'success', { title: 'Session uploaded' });
      expect(toasts.value[0]?.title).toBe('Session uploaded');
    });

    it('collects itemLabel values and passes them to summaryTemplate', () => {
      const { toasts, addToast } = useToast();
      addToast('msg1', 'success', {
        title: 'Upload',
        itemLabel: 'a.cast',
        summaryTemplate: (_, labels) => labels.join(', '),
      });
      addToast('msg2', 'success', {
        title: 'Upload',
        itemLabel: 'b.cast',
        summaryTemplate: (_, labels) => labels.join(', '),
      });
      expect(toasts.value[0]?.message).toBe('a.cast, b.cast');
    });

    it('collects original messages and passes them to summaryTemplate', () => {
      const { toasts, addToast } = useToast();
      addToast('msg1', 'success', {
        title: 'Upload',
        summaryTemplate: (_, _labels, messages) => messages.join(' | '),
      });
      addToast('msg2', 'success', {
        title: 'Upload',
        summaryTemplate: (_, _labels, messages) => messages.join(' | '),
      });
      expect(toasts.value[0]?.message).toBe('msg1 | msg2');
    });
  });

  describe('cleanup', () => {
    it('dismissed toast clears activeKeys; next toast of same kind starts fresh', async () => {
      const { toasts, addToast, removeToast } = useToast();

      // First burst: add, aggregate, then dismiss
      const id = addToast('f1', 'success', { title: 'Session uploaded' });
      addToast('f2', 'success', { title: 'Session uploaded' });
      expect(toasts.value).toHaveLength(1);

      // Dismiss the aggregated toast
      removeToast(id);
      expect(toasts.value).toHaveLength(0);

      // Flush post-DOM watcher so activeKeys gets cleaned up
      await nextTick();

      // New toast of same kind should be a fresh single (not count=3)
      addToast('f3', 'success', { title: 'Session uploaded' });
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('f3');
    });

    it('auto-dismissed toast clears activeKeys; next toast starts fresh', async () => {
      const { toasts, addToast } = useToast();

      addToast('f1', 'success', { title: 'Session uploaded' }); // 5000ms default
      vi.advanceTimersByTime(5001); // trigger auto-dismiss
      expect(toasts.value).toHaveLength(0);

      await nextTick();

      addToast('f2', 'success', { title: 'Session uploaded' });
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('f2');
    });

    it('gracefully handles updateToast returning false mid-burst by creating a fresh toast', async () => {
      const { toasts, addToast, removeToast } = useToast();

      // Add first toast
      const id = addToast('f1', 'success', { title: 'Session uploaded' });

      // Forcibly remove the toast WITHOUT going through aggregation cleanup
      removeToast(id);

      // nextTick NOT called yet — activeKeys still has stale entry for the key.
      addToast('f2', 'success', { title: 'Session uploaded' });

      // Should have exactly one fresh toast
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('f2');
    });

    it('resetToastState clears activeKeys; next titled toast starts fresh', () => {
      const { toasts, addToast } = useToast();
      addToast('f1', 'success', { title: 'Session uploaded' });
      addToast('f2', 'success', { title: 'Session uploaded' });
      expect(toasts.value[0]?.message).toBe('2 notifications');

      resetToastState();

      addToast('f3', 'success', { title: 'Session uploaded' });
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('f3');
    });
  });

  describe('titleless toasts bypass aggregation', () => {
    it('toast without title is created normally with no aggregation', () => {
      const { toasts, addToast } = useToast();
      addToast('No title here', 'success');
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe('No title here');
    });

    it('multiple titleless toasts each create separate toasts', () => {
      const { toasts, addToast } = useToast();
      addToast('First titleless', 'success');
      addToast('Second titleless', 'success');
      expect(toasts.value).toHaveLength(2);
    });

    it('titleless toasts do not interfere with titled toasts of same type', () => {
      const { toasts, addToast } = useToast();
      addToast('Titleless', 'success');
      addToast('Titled 1', 'success', { title: 'Upload' });
      addToast('Titled 2', 'success', { title: 'Upload' });
      // Titleless = 1 toast, titled = 1 aggregated toast
      expect(toasts.value).toHaveLength(2);
    });
  });
});
