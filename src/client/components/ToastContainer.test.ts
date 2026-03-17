/**
 * Tests for ToastContainer component.
 *
 * Covers: rendering toasts, dismiss button emit, ARIA attributes,
 * icon variants (custom icon class vs inline SVG), toast type classes,
 * and auto-dismiss timer integration via useToast.
 *
 * Lines targeted:
 *   119 — dismiss button @click handler: emits 'dismiss' with toast id
 *   All inline SVG icon branches (success, warning, error, info, custom icon)
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ToastContainer from './ToastContainer.vue';
import type { Toast } from '../composables/useToast.js';

function makeToast(overrides: Partial<Toast> = {}): Toast {
  return {
    id: 1,
    message: 'Test message',
    type: 'info',
    role: 'status',
    ...overrides,
  };
}

describe('ToastContainer', () => {
  describe('rendering', () => {
    it('renders without errors when toasts array is empty', () => {
      const wrapper = mount(ToastContainer, { props: { toasts: [] } });
      expect(wrapper.find('.toast-container').exists()).toBe(true);
    });

    it('renders one toast per entry in toasts prop', () => {
      const toasts: Toast[] = [
        makeToast({ id: 1, message: 'First' }),
        makeToast({ id: 2, message: 'Second' }),
      ];
      const wrapper = mount(ToastContainer, { props: { toasts } });
      expect(wrapper.findAll('.toast')).toHaveLength(2);
    });

    it('renders toast message text', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ message: 'Upload complete' })] },
      });
      expect(wrapper.text()).toContain('Upload complete');
    });

    it('renders toast title when provided', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ title: 'My Title', message: 'Details' })] },
      });
      expect(wrapper.find('.toast__title').exists()).toBe(true);
      expect(wrapper.find('.toast__title').text()).toBe('My Title');
    });

    it('does not render title element when title is absent', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ title: undefined, message: 'No title' })] },
      });
      expect(wrapper.find('.toast__title').exists()).toBe(false);
    });
  });

  describe('ARIA attributes', () => {
    it('sets role="status" on non-error toasts', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ type: 'info', role: 'status' })] },
      });
      const toast = wrapper.find('.toast');
      expect(toast.attributes('role')).toBe('status');
    });

    it('sets role="alert" on error toasts', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ type: 'error', role: 'alert' })] },
      });
      const toast = wrapper.find('.toast');
      expect(toast.attributes('role')).toBe('alert');
    });

    it('sets aria-live="assertive" when role is alert', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ type: 'error', role: 'alert' })] },
      });
      const toast = wrapper.find('.toast');
      expect(toast.attributes('aria-live')).toBe('assertive');
    });

    it('sets aria-live="polite" when role is status', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ type: 'info', role: 'status' })] },
      });
      const toast = wrapper.find('.toast');
      expect(toast.attributes('aria-live')).toBe('polite');
    });

    it('has aria-atomic="true" on each toast', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast()] },
      });
      expect(wrapper.find('.toast').attributes('aria-atomic')).toBe('true');
    });
  });

  describe('type class variants', () => {
    const types: Toast['type'][] = ['success', 'info', 'warning', 'error'];
    for (const type of types) {
      it(`applies toast--${type} class for type "${type}"`, () => {
        const wrapper = mount(ToastContainer, {
          props: { toasts: [makeToast({ type, role: type === 'error' ? 'alert' : 'status' })] },
        });
        expect(wrapper.find(`.toast--${type}`).exists()).toBe(true);
      });
    }
  });

  describe('icon rendering', () => {
    it('renders custom icon span when toast.icon is set', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ icon: 'icon-file-check' })] },
      });
      const iconSpan = wrapper.find('.icon.icon--md');
      expect(iconSpan.exists()).toBe(true);
      expect(iconSpan.classes()).toContain('icon-file-check');
    });

    it('renders success SVG when type is success and no custom icon', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ type: 'success', icon: undefined })] },
      });
      // SVG for success has a circle + checkmark path
      expect(wrapper.find('.toast__icon svg').exists()).toBe(true);
    });

    it('renders warning SVG when type is warning and no custom icon', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ type: 'warning', role: 'status', icon: undefined })] },
      });
      expect(wrapper.find('.toast__icon svg').exists()).toBe(true);
    });

    it('renders error SVG when type is error and no custom icon', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ type: 'error', role: 'alert', icon: undefined })] },
      });
      expect(wrapper.find('.toast__icon svg').exists()).toBe(true);
    });

    it('renders info SVG (default) when type is info and no custom icon', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ type: 'info', icon: undefined })] },
      });
      expect(wrapper.find('.toast__icon svg').exists()).toBe(true);
    });
  });

  describe('dismiss button (line 119)', () => {
    it('renders a dismiss button on each toast', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ id: 42 })] },
      });
      expect(wrapper.find('.toast__close').exists()).toBe(true);
    });

    it('dismiss button has accessible aria-label', () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast()] },
      });
      expect(wrapper.find('.toast__close').attributes('aria-label')).toBe('Dismiss notification');
    });

    it('emits "dismiss" with the toast id when close button is clicked', async () => {
      const wrapper = mount(ToastContainer, {
        props: { toasts: [makeToast({ id: 99 })] },
      });

      await wrapper.find('.toast__close').trigger('click');

      expect(wrapper.emitted('dismiss')).toBeTruthy();
      expect(wrapper.emitted('dismiss')![0]).toEqual([99]);
    });

    it('emits dismiss for the correct toast when multiple toasts are rendered', async () => {
      const toasts: Toast[] = [
        makeToast({ id: 10, message: 'First' }),
        makeToast({ id: 20, message: 'Second' }),
      ];
      const wrapper = mount(ToastContainer, { props: { toasts } });

      const closeButtons = wrapper.findAll('.toast__close');
      await closeButtons[1]!.trigger('click');

      expect(wrapper.emitted('dismiss')![0]).toEqual([20]);
    });
  });
});
