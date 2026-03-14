/**
 * Tests for ShellHeader hamburger button — Stage 13.
 *
 * Covers: hamburger button rendered on mobile (with layout injection),
 * hamburger calls openMobileOverlay, hamburger has accessible label,
 * hamburger button not visible when layout is desktop.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import ShellHeader from './ShellHeader.vue';
import { layoutKey } from '../composables/useLayout.js';
import { sessionListKey } from '../composables/useSessionList.js';
import type { SessionListState } from '../composables/useSessionList.js';
import type { Session } from '../../shared/types/session.js';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/session/:id', name: 'session-detail', component: { template: '<div />' } },
    ],
  });
}

function makeLayoutState(isMobile: boolean) {
  const openMobileOverlay = vi.fn();
  return {
    isSidebarOpen: ref(true),
    isMobile: ref(isMobile),
    isMobileOverlayOpen: ref(false),
    openMobileOverlay,
    closeMobileOverlay: vi.fn(),
    toggleSidebar: vi.fn(),
  };
}

function makeSessionListState(): SessionListState {
  const sessions = ref<Session[]>([]);
  return {
    sessions,
    loading: ref(false),
    error: ref(null),
    searchQuery: ref(''),
    statusFilter: ref('all' as const),
    filteredSessions: computed(() => sessions.value),
    fetchSessions: async () => {},
    deleteSession: async () => false,
  };
}

async function mountHeader(isMobile: boolean, path = '/') {
  const router = createTestRouter();
  await router.push(path);
  const layout = makeLayoutState(isMobile);
  const sessionList = makeSessionListState();

  const wrapper = mount(ShellHeader, {
    global: {
      plugins: [router],
      provide: {
        [layoutKey as symbol]: layout,
        [sessionListKey as symbol]: sessionList,
      },
    },
  });

  return { wrapper, layout };
}

describe('ShellHeader — hamburger button (Stage 13)', () => {
  describe('on mobile viewport', () => {
    it('renders the hamburger button when isMobile is true', async () => {
      const { wrapper } = await mountHeader(true);
      expect(wrapper.find('.shell-header__hamburger').exists()).toBe(true);
    });

    it('hamburger button has an aria-label for accessibility', async () => {
      const { wrapper } = await mountHeader(true);
      const btn = wrapper.find('.shell-header__hamburger');
      expect(btn.attributes('aria-label')).toBeTruthy();
    });

    it('clicking hamburger calls openMobileOverlay', async () => {
      const { wrapper, layout } = await mountHeader(true);
      await wrapper.find('.shell-header__hamburger').trigger('click');
      expect(layout.openMobileOverlay).toHaveBeenCalledOnce();
    });

    it('hamburger has type="button" to prevent form submission', async () => {
      const { wrapper } = await mountHeader(true);
      const btn = wrapper.find('.shell-header__hamburger');
      expect(btn.attributes('type')).toBe('button');
    });
  });

  describe('on desktop viewport', () => {
    it('does not render the hamburger button when isMobile is false', async () => {
      const { wrapper } = await mountHeader(false);
      expect(wrapper.find('.shell-header__hamburger').exists()).toBe(false);
    });
  });
});
