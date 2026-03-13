import { ref } from 'vue';

export type ToastRole = 'status' | 'alert';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  /** ARIA role: 'alert' for errors (assertive), 'status' for informational (polite). */
  role: ToastRole;
}

/** Default dismiss durations per toast type in milliseconds. */
const DISMISS_DURATION: Record<Toast['type'], number> = {
  success: 5000,
  info: 5000,
  error: 8000,
};

let nextId = 0;

/** Shared reactive toast list — module-level singleton so any composable can add toasts. */
const toasts = ref<Toast[]>([]);

/**
 * Provides access to the global toast list and helpers to add/remove toasts.
 * All callers share the same reactive state, so toasts added from upload or SSE
 * are displayed by the single ToastContainer rendered in SpatialShell.
 */
export function useToast() {
  /**
   * Adds a toast notification. Auto-dismisses after durationMs (defaults by type).
   * @param message - Toast body text.
   * @param type - Visual variant: 'success' | 'info' | 'error'.
   * @param durationMs - Override auto-dismiss time in ms. Pass 0 to disable auto-dismiss.
   */
  function addToast(
    message: string,
    type: Toast['type'] = 'info',
    durationMs?: number,
  ): void {
    const id = nextId++;
    const role: ToastRole = type === 'error' ? 'alert' : 'status';
    const duration = durationMs ?? DISMISS_DURATION[type];

    toasts.value.push({ id, message, type, role });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }

  function removeToast(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    addToast,
    removeToast,
  };
}
