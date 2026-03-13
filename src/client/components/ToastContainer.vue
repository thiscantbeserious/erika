<script setup lang="ts">
import type { Toast } from '../composables/useToast';

defineProps<{
  toasts: Toast[];
}>();

const emit = defineEmits<{
  dismiss: [id: number];
}>();
</script>

<template>
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.type}`"
      :role="toast.role"
      :aria-live="toast.role === 'alert' ? 'assertive' : 'polite'"
      aria-atomic="true"
    >
      <div
        class="toast__icon"
        aria-hidden="true"
      />
      <div class="toast__content">
        <p class="toast__message">
          {{ toast.message }}
        </p>
      </div>
      <button
        class="toast__close"
        aria-label="Dismiss notification"
        type="button"
        @click="emit('dismiss', toast.id)"
      >
        <span
          class="icon icon--sm icon-close"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* .toast and .toast__* come from design/styles/components.css */

.toast-container {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: var(--toast-max-width);
}

@keyframes toast-in {
  from {
    transform: translateY(var(--space-2));
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast {
  animation: toast-in var(--duration-normal) var(--easing-default);
}

/* Ensure the close button meets 44px touch target on mobile */
@media (max-width: 767px) {
  .toast__close {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
