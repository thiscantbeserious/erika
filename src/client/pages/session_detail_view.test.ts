/**
 * Tests for SessionDetailView component — Stage 9.
 *
 * Covers: loading state (skeleton), error state, empty session state,
 * content rendering, and that no standalone breadcrumb or container wrapper is present.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref, computed } from 'vue';

// Stub heavy dependencies
vi.mock('../composables/useSession.js', () => ({
  useSession: vi.fn(),
}));

vi.mock('../components/SessionContent.vue', () => ({
  default: { template: '<div class="session-content-stub" />' },
}));

vi.mock('../components/SkeletonMain.vue', () => ({
  default: { template: '<div class="skeleton-main-stub" />' },
}));

import { useSession } from '../composables/useSession.js';
import SessionDetailView from './SessionDetailView.vue';

const useSessionMock = vi.mocked(useSession);

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/session/:id', component: SessionDetailView },
    ],
  });
}

async function mountAtRoute(id: string, routerInstance?: ReturnType<typeof createTestRouter>) {
  const router = routerInstance ?? createTestRouter();
  await router.push(`/session/${id}`);
  return mount(SessionDetailView, {
    global: { plugins: [router] },
  });
}

beforeEach(() => {
  useSessionMock.mockReturnValue({
    session: ref(null),
    sections: ref([]),
    snapshot: ref(null),
    loading: ref(false),
    error: ref(null),
    filename: computed(() => ''),
    detectionStatus: ref('completed'),
  });
});

describe('SessionDetailView', () => {
  describe('loading state', () => {
    it('renders skeleton while loading', async () => {
      useSessionMock.mockReturnValue({
        session: ref(null),
        sections: ref([]),
        snapshot: ref(null),
        loading: ref(true),
        error: ref(null),
        filename: computed(() => ''),
        detectionStatus: ref('pending'),
      });

      const wrapper = await mountAtRoute('sess-1');
      expect(wrapper.find('.skeleton-main-stub').exists()).toBe(true);
    });

    it('does not render session content while loading', async () => {
      useSessionMock.mockReturnValue({
        session: ref(null),
        sections: ref([]),
        snapshot: ref(null),
        loading: ref(true),
        error: ref(null),
        filename: computed(() => ''),
        detectionStatus: ref('pending'),
      });

      const wrapper = await mountAtRoute('sess-1');
      expect(wrapper.find('.session-content-stub').exists()).toBe(false);
    });
  });

  describe('error state', () => {
    it('renders error message when error is present', async () => {
      useSessionMock.mockReturnValue({
        session: ref(null),
        sections: ref([]),
        snapshot: ref(null),
        loading: ref(false),
        error: ref('Session not found'),
        filename: computed(() => ''),
        detectionStatus: ref('failed'),
      });

      const wrapper = await mountAtRoute('missing-id');
      expect(wrapper.find('.session-detail-view__state--error').exists()).toBe(true);
      expect(wrapper.text()).toContain('Session not found');
    });

    it('does not render skeleton on error', async () => {
      useSessionMock.mockReturnValue({
        session: ref(null),
        sections: ref([]),
        snapshot: ref(null),
        loading: ref(false),
        error: ref('Session not found'),
        filename: computed(() => ''),
        detectionStatus: ref('failed'),
      });

      const wrapper = await mountAtRoute('missing-id');
      expect(wrapper.find('.skeleton-main-stub').exists()).toBe(false);
    });
  });

  describe('empty session state', () => {
    it('renders empty state when session has no content', async () => {
      useSessionMock.mockReturnValue({
        session: ref({ id: 'sess-1', filename: 'empty.cast' } as never),
        sections: ref([]),
        snapshot: ref(null),
        loading: ref(false),
        error: ref(null),
        filename: computed(() => 'empty.cast'),
        detectionStatus: ref('completed'),
      });

      const wrapper = await mountAtRoute('sess-1');
      expect(wrapper.find('.session-detail-view__state').exists()).toBe(true);
      expect(wrapper.text()).toContain('no content');
    });
  });

  describe('content rendering', () => {
    it('renders SessionContent when sections are present', async () => {
      useSessionMock.mockReturnValue({
        session: ref({ id: 'sess-1', filename: 'demo.cast' } as never),
        sections: ref([{ id: 's1', title: 'Intro' }] as never),
        snapshot: ref(null),
        loading: ref(false),
        error: ref(null),
        filename: computed(() => 'demo.cast'),
        detectionStatus: ref('completed'),
      });

      const wrapper = await mountAtRoute('sess-1');
      expect(wrapper.find('.session-content-stub').exists()).toBe(true);
    });

    it('renders SessionContent when snapshot is present (no sections)', async () => {
      useSessionMock.mockReturnValue({
        session: ref({ id: 'sess-1', filename: 'demo.cast' } as never),
        sections: ref([]),
        snapshot: ref({ cells: [] } as never),
        loading: ref(false),
        error: ref(null),
        filename: computed(() => 'demo.cast'),
        detectionStatus: ref('completed'),
      });

      const wrapper = await mountAtRoute('sess-1');
      expect(wrapper.find('.session-content-stub').exists()).toBe(true);
    });
  });

  describe('layout', () => {
    it('does not render a standalone breadcrumb nav', async () => {
      useSessionMock.mockReturnValue({
        session: ref({ id: 'sess-1', filename: 'demo.cast' } as never),
        sections: ref([{ id: 's1', title: 'Intro' }] as never),
        snapshot: ref(null),
        loading: ref(false),
        error: ref(null),
        filename: computed(() => 'demo.cast'),
        detectionStatus: ref('completed'),
      });

      const wrapper = await mountAtRoute('sess-1');
      expect(wrapper.find('.breadcrumb').exists()).toBe(false);
    });

    it('does not render a container wrapper class', async () => {
      useSessionMock.mockReturnValue({
        session: ref({ id: 'sess-1', filename: 'demo.cast' } as never),
        sections: ref([{ id: 's1', title: 'Intro' }] as never),
        snapshot: ref(null),
        loading: ref(false),
        error: ref(null),
        filename: computed(() => 'demo.cast'),
        detectionStatus: ref('completed'),
      });

      const wrapper = await mountAtRoute('sess-1');
      expect(wrapper.find('.container').exists()).toBe(false);
    });

    it('root element has the session-detail-view class', async () => {
      const wrapper = await mountAtRoute('sess-1');
      expect(wrapper.find('.session-detail-view').exists()).toBe(true);
    });
  });
});
