<template>
  <header
    class="spatial-shell__header shell-header"
    aria-label="Application header"
  >
    <div class="shell-header__left">
      <nav
        v-if="isSessionRoute"
        class="shell-header__breadcrumb"
        aria-label="Breadcrumb"
      >
        <router-link
          to="/"
          class="shell-header__breadcrumb-home"
        >
          Sessions
        </router-link>
        <span
          class="shell-header__breadcrumb-sep"
          aria-hidden="true"
        >/</span>
        <span class="shell-header__breadcrumb-current">
          {{ sessionLabel }}
        </span>
      </nav>
    </div>
    <div class="shell-header__right" />
  </header>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { useRoute } from 'vue-router';
import { sessionListKey } from '../composables/useSessionList.js';

/**
 * ShellHeader renders the application header bar spanning the two right columns.
 * On session detail routes it shows a reactive breadcrumb: Sessions > {filename}.
 * Session filename is resolved from the injected session list (provided by SpatialShell).
 */

const route = useRoute();
const sessionList = inject(sessionListKey);

/** True when the current route is a session detail page. */
const isSessionRoute = computed(() => route.name === 'session-detail');

/**
 * Resolves the display label for the current session breadcrumb.
 * Uses filename from the session list if available; falls back to the raw ID.
 */
const sessionLabel = computed(() => {
  const id = route.params.id as string | undefined;
  if (!id) return '';
  const session = sessionList?.sessions.value.find((s) => s.id === id);
  return session?.filename ?? id;
});
</script>

<style scoped>
/**
 * ShellHeader — primary header bar spanning the two right columns.
 * Clean, minimal. The gradient bottom border is the main visual element —
 * a TRON light-trail connecting from the brand mark junction to the right edge.
 */
.shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding-inline: var(--space-6);
  background: var(--bg-surface);
  position: relative;
}

/* TRON gradient bottom border — runs from cyan (left) through to pink (right). */
.shell-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    var(--accent-primary) 0%,
    var(--accent-primary) 40%,
    var(--accent-secondary) 85%,
    transparent 100%
  );
  opacity: 0.7;
  box-shadow:
    0 0 8px var(--accent-primary-glow),
    0 0 20px rgba(0, 212, 255, 0.12);
}

/* Left section — holds breadcrumbs when on a session detail route. */
.shell-header__left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-width: 0;
  flex: 1;
}

/* Right section — will hold global actions in a future stage. */
.shell-header__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Breadcrumb nav — inline flex row with separator. */
.shell-header__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  min-width: 0;
}

/* "Sessions" home link — muted, underline on hover. */
.shell-header__breadcrumb-home {
  color: var(--text-muted);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.shell-header__breadcrumb-home:hover {
  color: var(--text-secondary);
  text-decoration: underline;
}

/* "/" separator — disabled color, no shrink. */
.shell-header__breadcrumb-sep {
  color: var(--text-disabled);
  flex-shrink: 0;
  user-select: none;
}

/* Current session filename — primary color, mono font, truncated. */
.shell-header__breadcrumb-current {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
</style>
