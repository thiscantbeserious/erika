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
  /** Domain-neutral label for this item (e.g., filename). Collected into itemLabels array. */
  itemLabel?: string;
  /** Plural noun for built-in summary, e.g. "sessions uploaded" → "5 sessions uploaded". */
  summaryNoun?: string;
  /** When true, appends truncated item labels to the summary: "3 failed: a.cast, b.cast and 1 more". */
  showItemLabels?: boolean;
  /**
   * Full override for summary formatting. When provided, `summaryNoun` and `showItemLabels` are ignored.
   * Called only when count > 1. First caller's template is used for the key's lifetime.
   */
  summaryTemplate?: (count: number, itemLabels: string[], messages: string[]) => string;
}

/** Tracks state for an active aggregation key. */
interface AggregationState {
  toastId: number;
  count: number;
  itemLabels: string[];
  messages: string[];
  summaryNoun?: string;
  showItemLabels?: boolean;
  /** When set, overrides summaryNoun + showItemLabels entirely. */
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

/** Builds a truncated label tail like "a.cast, b.cast and 3 more". */
function formatLabelTail(labels: string[], max = 3): string {
  const head = labels.slice(0, max).join(', ');
  if (labels.length <= max) return head;
  return `${head} and ${labels.length - max} more`;
}

/** Builds the aggregated summary using built-in options or summaryTemplate override. */
function buildSummary(state: AggregationState): string {
  if (state.summaryTemplate) {
    return state.summaryTemplate(state.count, state.itemLabels, state.messages);
  }
  const base = `${state.count} ${state.summaryNoun ?? 'notifications'}`;
  if (!state.showItemLabels || state.itemLabels.length === 0) return base;
  return `${base}: ${formatLabelTail(state.itemLabels)}`;
}

/** Creates a fresh aggregation entry in activeKeys for the given key. */
function trackNewAggregation(
  key: string, id: number, message: string, opts: AddToastOptions,
): void {
  activeKeys.set(key, {
    toastId: id,
    count: 1,
    itemLabels: opts.itemLabel !== undefined ? [opts.itemLabel] : [],
    messages: [message],
    summaryNoun: opts.summaryNoun,
    showItemLabels: opts.showItemLabels,
    summaryTemplate: opts.summaryTemplate,
  });
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
  function addTitledToast(
    message: string,
    type: Toast['type'],
    title: string,
    icon: string | undefined,
    opts: AddToastOptions,
  ): number {
    const key = `${title}\0${type}`;
    const existing = activeKeys.get(key);

    if (existing) {
      return mergeIntoExisting(existing, key, message, type, opts);
    }

    const id = createFreshToast(message, type, { ...opts, title, icon });
    trackNewAggregation(key, id, message, opts);
    return id;
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

    const summary = buildSummary(existing);

    if (!updateToast(existing.toastId, { message: summary })) {
      activeKeys.delete(key);
      const id = createFreshToast(message, type, opts);
      trackNewAggregation(key, id, message, {
        ...opts,
        summaryTemplate: existing.summaryTemplate,
        summaryNoun: existing.summaryNoun,
        showItemLabels: existing.showItemLabels,
      });
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
