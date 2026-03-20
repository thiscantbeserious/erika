import { ref, watch, effectScope } from 'vue';
import type { EffectScope } from 'vue';

export type ToastRole = 'status' | 'alert';

export interface Toast {
  id: number;
  /** Optional short heading displayed above the message. */
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  /** ARIA role: 'alert' for errors (assertive), 'status' for informational (polite). */
  role: ToastRole;
  /** Optional icon class from design system (e.g., 'icon-file-check'). When set, renders a design system icon instead of the default SVG. */
  icon?: string;
}

/** Options accepted by addToast. The legacy numeric form is also supported for backward compat. */
export interface AddToastOptions {
  title?: string;
  durationMs?: number;
  icon?: string;
  /**
   * Optional callback to produce the aggregated summary message.
   * Called only when count > 1. First caller's template is used for the key's lifetime.
   * @param count - Number of toasts merged so far.
   * @param itemLabels - Collected itemLabel values from each addToast call.
   * @param messages - Collected raw message strings from each addToast call.
   */
  summaryTemplate?: (count: number, itemLabels: string[], messages: string[]) => string;
  /** Domain-neutral label for this item (e.g., filename). Collected into itemLabels array. */
  itemLabel?: string;
}

/** Tracks state for an active aggregation key. */
interface AggregationState {
  toastId: number;
  count: number;
  itemLabels: string[];
  messages: string[];
  /** Stored from the first toast so subsequent callers don't need to provide it. */
  summaryTemplate?: (count: number, itemLabels: string[], messages: string[]) => string;
}

/** Default dismiss durations per toast type in milliseconds. */
const DISMISS_DURATION: Record<Toast['type'], number> = {
  success: 5000,
  info: 5000,
  warning: 6000,
  error: 8000,
};

let nextId = 0;

/** Shared reactive toast list — module-level singleton so any composable can add toasts. */
const toasts = ref<Toast[]>([]);

/** Tracks active auto-dismiss timers by toast id so they can be cancelled on manual dismiss. */
const timers = new Map<number, ReturnType<typeof setTimeout>>();

/**
 * Module-level map of active aggregation keys to their state.
 * Key format: `${title}\0${type}` — null byte prevents collisions with type-in-title.
 */
const activeKeys = new Map<string, AggregationState>();

/** Lazily created effectScope that hosts the toasts watcher for activeKeys cleanup. */
let watchScope: EffectScope | null = null;

/** Removes a toast by id and cancels its auto-dismiss timer if one is pending. */
function removeToast(id: number): void {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

/** Schedules auto-dismiss for a toast. Cancels any existing timer for the same id first. */
function scheduleAutoDismiss(id: number, type: Toast['type'], durationMs?: number): void {
  const existing = timers.get(id);
  if (existing !== undefined) clearTimeout(existing);

  const duration = durationMs ?? DISMISS_DURATION[type];
  if (duration > 0) {
    timers.set(id, setTimeout(() => { removeToast(id); }, duration));
  }
}

/**
 * Ensures the effectScope and its shallow watch on `toasts` exist.
 * Called lazily on first useToast() invocation so module import has no side effects.
 * The watch prunes stale activeKeys entries after any toast is removed.
 */
function ensureWatchScope(): void {
  if (watchScope !== null) return;

  watchScope = effectScope();
  watchScope.run(() => {
    watch(toasts, () => {
      const currentIds = new Set(toasts.value.map((t) => t.id));
      for (const [key, state] of activeKeys) {
        if (!currentIds.has(state.toastId)) {
          activeKeys.delete(key);
        }
      }
    }, { flush: 'post' });
  });
}

/**
 * Resets module-level singleton state between tests.
 * Only for use in test files — do not call in production code.
 */
export function resetToastState(): void {
  nextId = 0;
  toasts.value = [];
  timers.forEach(clearTimeout);
  timers.clear();
  activeKeys.clear();
  watchScope?.stop();
  watchScope = null;
}

/**
 * Provides access to the global toast list and helpers to add/update/remove toasts.
 * All callers share the same reactive state, so toasts added from upload or SSE
 * are displayed by the single ToastContainer rendered in SpatialShell.
 *
 * Titled toasts participate in automatic aggregation: multiple toasts sharing the
 * same title+type merge into a single updating toast instead of stacking.
 */
export function useToast() {
  ensureWatchScope();

  /**
   * Updates fields of an existing toast in place and resets its auto-dismiss timer.
   * Returns true if the toast was found and updated, false if the id no longer exists.
   */
  function updateToast(
    id: number,
    fields: Partial<Pick<Toast, 'message' | 'title' | 'icon'>>,
  ): boolean {
    const toast = toasts.value.find((t) => t.id === id);
    if (!toast) return false;

    if (fields.message !== undefined) toast.message = fields.message;
    if (fields.title !== undefined) toast.title = fields.title;
    if (fields.icon !== undefined) toast.icon = fields.icon;

    scheduleAutoDismiss(id, toast.type);
    return true;
  }

  /**
   * Adds a toast notification. Auto-dismisses after durationMs (defaults by type).
   * Titled toasts participate in aggregation: same title+type merges into existing toast.
   * @param message - Toast body text.
   * @param type - Visual variant: 'success' | 'info' | 'warning' | 'error'.
   * @param options - Optional title, durationMs, icon, summaryTemplate, itemLabel.
   * @returns The toast id (number).
   */
  function addToast(
    message: string,
    type: Toast['type'] = 'info',
    options?: AddToastOptions | number,
  ): number {
    const opts = typeof options === 'number' ? { durationMs: options } : (options ?? {});
    const { title, icon } = opts;

    if (!title) {
      return createFreshToast(message, type, opts);
    }

    return addTitledToast(message, type, title, icon, opts);
  }

  /** Creates a brand-new toast entry with no aggregation tracking. */
  function createFreshToast(
    message: string,
    type: Toast['type'],
    opts: AddToastOptions,
  ): number {
    const id = nextId++;
    const role: ToastRole = type === 'error' ? 'alert' : 'status';
    toasts.value.push({ id, title: opts.title, message, type, role, icon: opts.icon });
    scheduleAutoDismiss(id, type, opts.durationMs);
    return id;
  }

  /**
   * Handles addToast for titled toasts — checks activeKeys and either aggregates
   * into the existing toast or creates a fresh one.
   */
  /** Creates a fresh aggregation entry in activeKeys for the given key. */
  function trackNewAggregation(
    key: string, id: number, message: string, opts: AddToastOptions,
  ): void {
    activeKeys.set(key, {
      toastId: id,
      count: 1,
      itemLabels: opts.itemLabel !== undefined ? [opts.itemLabel] : [],
      messages: [message],
      summaryTemplate: opts.summaryTemplate,
    });
  }

  function addTitledToast(
    message: string,
    type: Toast['type'],
    title: string,
    icon: string | undefined,
    opts: AddToastOptions,
  ): number {
    const key = `${title}\0${type}`;
    const existing = activeKeys.get(key);

    if (!existing) {
      const id = createFreshToast(message, type, { ...opts, title, icon });
      trackNewAggregation(key, id, message, opts);
      return id;
    }

    return mergeIntoExisting(existing, key, message, type, opts);
  }

  /**
   * Merges a new toast occurrence into an existing aggregation state.
   * If the existing toast was dismissed before this call, falls back to creating fresh.
   */
  function mergeIntoExisting(
    existing: AggregationState,
    key: string,
    message: string,
    type: Toast['type'],
    opts: AddToastOptions,
  ): number {
    existing.count++;
    if (opts.itemLabel !== undefined) existing.itemLabels.push(opts.itemLabel);
    existing.messages.push(message);

    const template = existing.summaryTemplate;
    const summary = template
      ? template(existing.count, existing.itemLabels, existing.messages)
      : `${existing.count} notifications`;

    if (!updateToast(existing.toastId, { message: summary })) {
      activeKeys.delete(key);
      const id = createFreshToast(message, type, opts);
      trackNewAggregation(key, id, message, { ...opts, summaryTemplate: existing.summaryTemplate });
      return id;
    }

    return existing.toastId;
  }

  return {
    toasts,
    addToast,
    updateToast,
    removeToast,
  };
}
