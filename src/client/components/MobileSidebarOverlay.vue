<template>
  <Teleport to="body">
    <template v-if="isMobileOverlayOpen">
      <!-- Backdrop -->
      <div
        class="mobile-sidebar-overlay__backdrop"
        aria-hidden="true"
        @click="onBackdropClick"
      />
      <!-- Slide-in panel -->
      <div
        ref="panelRef"
        class="mobile-sidebar-overlay__panel"
        :class="{ 'mobile-sidebar-overlay__panel--open': isMobileOverlayOpen }"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation sidebar"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <div
          class="mobile-sidebar-overlay"
        >
          <SidebarPanel />
        </div>
      </div>
    </template>
  </Teleport>
</template>

<script setup lang="ts">
import { inject, watch, nextTick, ref } from 'vue';
import { useRoute } from 'vue-router';
import SidebarPanel from './SidebarPanel.vue';
import { layoutKey } from '../composables/useLayout.js';

/**
 * MobileSidebarOverlay renders the sidebar as a slide-in overlay on mobile viewports.
 * Wraps SidebarPanel in a full-screen dialog with backdrop, focus trap, and ARIA attributes.
 * Controlled by isMobileOverlayOpen from the injected layout state.
 * Closes automatically on route navigation (session card selection).
 */

const layout = inject(layoutKey);
if (!layout) {
  throw new Error('MobileSidebarOverlay: layoutKey not provided. Ensure SpatialShell provides it.');
}

const { isMobileOverlayOpen, closeMobileOverlay } = layout;
const route = useRoute();
const panelRef = ref<HTMLElement | null>(null);

/** Queries all keyboard-focusable elements within the panel. */
function getFocusableElements(): HTMLElement[] {
  if (!panelRef.value) return [];
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  return Array.from(panelRef.value.querySelectorAll<HTMLElement>(selector));
}

/** Focus trap: cycles focus within the panel on Tab/Shift+Tab. */
function trapFocus(event: KeyboardEvent): void {
  const focusable = getFocusableElements();
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const isShift = event.shiftKey;

  if (isShift && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!isShift && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

/** Handles keydown on the panel: Escape closes, Tab traps. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeMobileOverlay();
    return;
  }
  if (event.key === 'Tab') {
    trapFocus(event);
  }
}

/** Closes the overlay when the backdrop is clicked. */
function onBackdropClick(): void {
  closeMobileOverlay();
}

/** Focus the panel when it opens so keyboard and screen readers work immediately. */
watch(isMobileOverlayOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    panelRef.value?.focus();
  }
});

/** Close overlay on route change — handles session card selection. */
watch(() => route.fullPath, (newPath, oldPath) => {
  if (newPath !== oldPath && isMobileOverlayOpen.value) {
    closeMobileOverlay();
  }
});
</script>

<style scoped>
/**
 * MobileSidebarOverlay — slide-in sidebar drawer for mobile viewports.
 * Only rendered when isMobileOverlayOpen is true (controlled by useLayout).
 * Uses fixed positioning so it floats above the grid layout.
 */

/* Backdrop: full-viewport dim layer behind the panel. */
.mobile-sidebar-overlay__backdrop {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  z-index: var(--z-overlay-backdrop, 200);
}

/* Slide-in panel container: fixed left column. */
.mobile-sidebar-overlay__panel {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100dvh;
  z-index: var(--z-overlay-panel, 201);
  /* Start off-screen to the left; --open modifier brings it in. */
  transform: translateX(-100%);
  transition: transform 175ms ease-out;
  outline: none; /* Panel is focusable but we manage visual focus internally. */
}

.mobile-sidebar-overlay__panel--open {
  transform: translateX(0);
}

/* Inner wrapper that fills the panel and hosts SidebarPanel. */
.mobile-sidebar-overlay {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-surface);
  overflow: hidden;
}

/* Respect prefers-reduced-motion: skip slide animation. */
@media (prefers-reduced-motion: reduce) {
  .mobile-sidebar-overlay__panel {
    transition: none;
  }
}
</style>
