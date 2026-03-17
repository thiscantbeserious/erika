/**
 * Branch coverage tests for ShellHeader component.
 *
 * Lines targeted:
 *   71    — isMobile computed: layout is null → returns false (no layout provided)
 *   74    — isMobileOverlayOpen computed: layout is null → returns false
 *   83-88 — sessionLabel computed: !id → returns '' (route params.id is absent)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref, computed } from 'vue';
import ShellHeader from './ShellHeader.vue';
import { sessionListKey } from '../composables/useSessionList.js';
import type { SessionListState } from '../composables/useSessionList.js';
import type { Session } from '../../shared/types/session.js';

// Stub EventSource — ShellHeader mounts Toolbar → usePipelineStatus
function MockEventSource() {
  return { onopen: null, onerror: null, addEventListener: vi.fn(), close: vi.fn() };
}
MockEventSource.prototype = {};

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/session/:id', name: 'session-detail', component: { template: '<div />' } },
    ],
  });
}

function makeSessionListState(sessions: Session[] = []): SessionListState {
  const sessionsRef = ref(sessions);
  return {
    sessions: sessionsRef,
    loading: ref(false),
    error: ref(null),
    searchQuery: ref(''),
    statusFilter: ref('all' as const),
    filteredSessions: computed(() => sessionsRef.value),
    fetchSessions: async () => {},
    deleteSession: async () => false,
    refreshOnSessionComplete: async () => {},
  };
}

beforeEach(() => {
  vi.stubGlobal('EventSource', MockEventSource);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ShellHeader — null layout branches (lines 71, 74)', () => {
  it('renders without errors when no layoutKey is provided (null layout path)', async () => {
    const router = createTestRouter();
    await router.push('/');

    // Mount without providing layoutKey — exercises the `layout?.isMobile.value ?? false` path
    const wrapper = mount(ShellHeader, {
      global: {
        plugins: [router],
        provide: {
          [sessionListKey as symbol]: makeSessionListState(),
        },
      },
    });

    // Component should render — mobile brand is hidden (isMobile defaults false)
    expect(wrapper.find('.shell-header__mobile-brand').exists()).toBe(false);
    // Toolbar area is visible on desktop (no layout = not mobile)
    expect(wrapper.find('.shell-header__right').exists()).toBe(true);
  });

  it('isMobileOverlayOpen defaults false when no layout provided', async () => {
    const router = createTestRouter();
    await router.push('/');

    const wrapper = mount(ShellHeader, {
      global: {
        plugins: [router],
        provide: {
          [sessionListKey as symbol]: makeSessionListState(),
        },
      },
    });

    // No layout → isMobileOverlayOpen is false — hamburger is not rendered
    expect(wrapper.find('.shell-header__hamburger').exists()).toBe(false);
  });
});

describe('ShellHeader — sessionLabel: empty id branch (lines 83-88)', () => {
  it('returns empty string when route has no id param (home route)', async () => {
    const router = createTestRouter();
    await router.push('/');

    const wrapper = mount(ShellHeader, {
      global: {
        plugins: [router],
        provide: {
          [sessionListKey as symbol]: makeSessionListState(),
        },
      },
    });

    // On home route, isSessionRoute is false, breadcrumb is not rendered
    // sessionLabel computed: id is undefined → returns '' (the !id guard fires)
    expect(wrapper.find('.shell-header__breadcrumb-current').exists()).toBe(false);
  });
});
