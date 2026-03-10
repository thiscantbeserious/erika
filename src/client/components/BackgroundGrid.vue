<script setup lang="ts">
/**
 * Renders a TRON-style SVG grid background that fills its parent container.
 * Grid pattern fades in on mount via the gridFadeIn keyframe animation.
 * Respects prefers-reduced-motion: shows grid at full opacity immediately.
 */

/** Unique suffix ensures no pattern ID collision when multiple instances exist. */
const uid = Math.random().toString(36).slice(2, 8);
const patternId = `background-grid-${uid}`;
</script>

<!-- Copied from design/drafts/theme-tron-v1.html lines 1296-1308 (HTML), 241-243 (CSS gridFadeIn class), 891-894 (gridFadeIn keyframe), 940-942 (motion animation), 910-911 (reduced-motion override) -->
<template>
  <!-- aria-hidden: purely decorative, pointer-events: none: non-interactive -->
  <svg
    class="tron-grid"
    :viewBox="`0 0 1280 600`"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;"
  >
    <!-- FIX 2: TRON fine LINE grid pattern — thin cyan lines forming a lattice
         Opacity increased to 0.12 for clear visibility -->
    <defs>
      <pattern :id="patternId" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <!-- Horizontal grid line -->
        <line x1="0" y1="0" x2="40" y2="0" stroke="#00d4ff" stroke-width="0.4" opacity="0.22"/>
        <!-- Vertical grid line -->
        <line x1="0" y1="0" x2="0" y2="40" stroke="#00d4ff" stroke-width="0.4" opacity="0.22"/>
        <!-- Intersection dots — brighter at crosspoints -->
        <circle cx="0" cy="0" r="0.8" fill="#00d4ff" opacity="0.3"/>
      </pattern>
    </defs>
    <rect class="landing-empty__grid-dots" width="100%" height="100%" :fill="`url(#${patternId})`"/>
  </svg>
</template>

<style scoped>
/* Copied from design/drafts/theme-tron-v1.html lines 241-243 */
/* FIX 2: Grid pattern starts invisible, animates in */
.landing-empty__grid-dots {
  opacity: 0;
}

/* Copied from design/drafts/theme-tron-v1.html lines 891-894 */
@keyframes gridFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Copied from design/drafts/theme-tron-v1.html lines 937-942 */
@media (prefers-reduced-motion: no-preference) {
  /* 1. FIX 2: Grid fades in to HIGHER opacity — clearly visible TRON lattice */
  .landing-empty__grid-dots {
    animation: gridFadeIn 1.5s ease-out forwards;
  }
}

/* Copied from design/drafts/theme-tron-v1.html lines 910-911 */
@media (prefers-reduced-motion: reduce) {
  .landing-empty__grid-dots { opacity: 1 !important; }
}
</style>
