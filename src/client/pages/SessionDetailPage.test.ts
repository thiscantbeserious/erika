/**
 * Unit tests for SessionDetailPage.
 * Covers loading skeleton, error state, empty state, and content state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref, computed } from 'vue';
import SessionDetailPage from './SessionDetailPage.vue';

vi.mock('../composables/useSession', () => ({
  useSession: vi.fn(),
}));

import { useSession } from '../composables/useSession';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'landing', component: { template: '<div />' } },
    { path: '/session/:id', name: 'session-detail', component: { template: '<div />' } },
  ],
});

interface SetupOptions {
  loading?: boolean;
  error?: string | null;
  sections?: unknown[];
  snapshot?: unknown;
  filename?: string;
}

function setupMocks({
  loading = false,
  error = null,
  sections = [],
  snapshot = null,
  filename = '',
}: SetupOptions = {}) {
  vi.mocked(useSession).mockReturnValue({
    session: ref(null),
    sections: ref(sections),
    snapshot: ref(snapshot),
    loading: ref(loading),
    error: ref(error),
    filename: computed(() => filename),
    detectionStatus: ref('completed'),
  } as ReturnType<typeof useSession>);
}

async function mountPage() {
  await router.push('/session/test-id');
  return mount(SessionDetailPage, {
    global: { plugins: [router] },
  });
}

describe('SessionDetailPage — loading skeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT render plain "Loading session..." text when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    expect(wrapper.text()).not.toContain('Loading session...');
    wrapper.unmount();
  });

  it('renders .detail-skeleton__breadcrumb when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    expect(wrapper.find('.detail-skeleton__breadcrumb').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders .terminal-chrome when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    expect(wrapper.find('.terminal-chrome').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders .detail-header when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    expect(wrapper.find('.detail-header').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders .detail-viewer when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    expect(wrapper.find('.detail-viewer').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders skeleton breadcrumb items when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    expect(wrapper.find('.detail-skeleton__breadcrumb-item').exists()).toBe(true);
    expect(wrapper.find('.detail-skeleton__breadcrumb-sep').exists()).toBe(true);
    expect(wrapper.find('.detail-skeleton__breadcrumb-current').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders skeleton filename and badge when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    expect(wrapper.find('.detail-skeleton__filename').exists()).toBe(true);
    expect(wrapper.find('.detail-skeleton__badge').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders skeleton section headers when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    const headers = wrapper.findAll('.detail-skeleton__section-header');
    expect(headers.length).toBeGreaterThanOrEqual(3);
    wrapper.unmount();
  });

  it('renders skeleton line rows when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    const lineRows = wrapper.findAll('.detail-skeleton__line-row');
    expect(lineRows.length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('hides real header breadcrumb when loading', async () => {
    setupMocks({ loading: true });
    const wrapper = await mountPage();
    expect(wrapper.find('.session-detail-page__header').exists()).toBe(false);
    wrapper.unmount();
  });
});

describe('SessionDetailPage — error state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error message when error is set', async () => {
    setupMocks({ loading: false, error: 'Session not found' });
    const wrapper = await mountPage();
    expect(wrapper.find('.session-detail-page__state--error').exists()).toBe(true);
    expect(wrapper.text()).toContain('Session not found');
    wrapper.unmount();
  });

  it('does NOT render skeleton when error is set', async () => {
    setupMocks({ loading: false, error: 'Session not found' });
    const wrapper = await mountPage();
    expect(wrapper.find('.detail-skeleton__breadcrumb').exists()).toBe(false);
    wrapper.unmount();
  });
});

describe('SessionDetailPage — empty content state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty message when no sections and no snapshot', async () => {
    setupMocks({ loading: false, sections: [], snapshot: null });
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain('This session has no content.');
    wrapper.unmount();
  });
});

describe('SessionDetailPage — real header shown when not loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders .session-detail-page__header when not loading', async () => {
    setupMocks({ loading: false });
    const wrapper = await mountPage();
    expect(wrapper.find('.session-detail-page__header').exists()).toBe(true);
    wrapper.unmount();
  });

  it('does NOT render .detail-skeleton__breadcrumb when not loading', async () => {
    setupMocks({ loading: false });
    const wrapper = await mountPage();
    expect(wrapper.find('.detail-skeleton__breadcrumb').exists()).toBe(false);
    wrapper.unmount();
  });
});
