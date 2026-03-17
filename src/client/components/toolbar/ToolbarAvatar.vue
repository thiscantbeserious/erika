<template>
  <button
    class="toolbar-avatar"
    aria-label="User menu"
    type="button"
  >
    {{ initial }}
  </button>
</template>

<script setup lang="ts">
/**
 * ToolbarAvatar — 30px gradient initial circle for the user menu trigger.
 * Renders a single-character initial; defaults to "S" as a placeholder.
 * Designed to sit at the trailing end of the glass pill toolbar.
 */
withDefaults(defineProps<{ initial?: string }>(), { initial: 'S' });
</script>

<style scoped>
/**
 * Gradient initial avatar button — from Draft 2b (draft-2b-lucide.html).
 * CSS values copied exactly from the approved mockup spec.
 */
.toolbar-avatar {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(255, 77, 106, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--duration-normal) var(--easing-default);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  padding: 0;
  flex-shrink: 0;
}

.toolbar-avatar:hover {
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
}

.toolbar-avatar:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .toolbar-avatar {
    transition: none;
  }
}
</style>
