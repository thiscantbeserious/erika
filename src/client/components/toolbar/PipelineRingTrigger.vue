<template>
  <button
    class="pipeline-ring-trigger"
    aria-label="Pipeline status"
    type="button"
  >
    <svg
      class="progress-ring"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        class="progress-ring__bg"
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke-width="2"
      />
      <circle
        class="progress-ring__fill"
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke-width="2"
        stroke-dasharray="56.55"
        stroke-dashoffset="56.55"
      />
    </svg>
    <span class="ring-count">0</span>
  </button>
</template>

<script setup lang="ts">
/**
 * PipelineRingTrigger — placeholder stub for the SVG progress ring toolbar trigger.
 * This is a structural placeholder for Stage 3 which implements the full ring
 * with live pipeline status binding. Do not add business logic here.
 */
</script>

<style scoped>
/**
 * Pipeline ring trigger stub — minimal styles for layout integration.
 * Full visual treatment is implemented in Stage 3.
 */
.pipeline-ring-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0 var(--space-1);
  color: var(--text-secondary);
}

.progress-ring {
  flex-shrink: 0;
}

.progress-ring__bg {
  stroke: rgba(0, 212, 255, 0.15);
}

.progress-ring__fill {
  stroke: rgba(0, 212, 255, 0.6);
}

.ring-count {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  min-width: 12px;
  text-align: center;
}
</style>
