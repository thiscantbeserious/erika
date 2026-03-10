<script setup lang="ts">
/**
 * Renders 8 hardcoded ambient data particles floating over the background.
 * Color distribution: 6 cyan (particles 1/3/4/5/6/8) + 2 pink (particles 2/7).
 * Respects prefers-reduced-motion: hides all particles when motion is reduced.
 */
</script>

<!-- Copied from design/drafts/theme-tron-v1.html lines 1410-1418 (HTML), 670-676 (base CSS), 814-876 (keyframes), 1097-1199 (motion-allowed particle styles), 925 (reduced-motion override) -->
<template>
  <!-- Ambient data particles — predominantly cyan, sparse pink -->
  <div class="landing-empty__ambient-particles" aria-hidden="true">
    <!-- Particle 1: cyan, 4px, top-left -->
    <div class="landing-empty__ambient-particle landing-empty__ambient-particle--1" aria-hidden="true"></div>
    <!-- Particle 2: pink, 4px, top-right -->
    <div class="landing-empty__ambient-particle landing-empty__ambient-particle--2" aria-hidden="true"></div>
    <!-- Particle 3: cyan, 4px, mid-left -->
    <div class="landing-empty__ambient-particle landing-empty__ambient-particle--3" aria-hidden="true"></div>
    <!-- Particle 4: cyan, 5px, mid-right -->
    <div class="landing-empty__ambient-particle landing-empty__ambient-particle--4" aria-hidden="true"></div>
    <!-- Particle 5: cyan, 6px (larger), bottom-left -->
    <div class="landing-empty__ambient-particle landing-empty__ambient-particle--5" aria-hidden="true"></div>
    <!-- Particle 6: cyan, 4px, bottom-right -->
    <div class="landing-empty__ambient-particle landing-empty__ambient-particle--6" aria-hidden="true"></div>
    <!-- Particle 7: pink, 4px, upper-center-left -->
    <div class="landing-empty__ambient-particle landing-empty__ambient-particle--7" aria-hidden="true"></div>
    <!-- Particle 8: cyan, 5px, lower-center-right -->
    <div class="landing-empty__ambient-particle landing-empty__ambient-particle--8" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
/* Copied from design/drafts/theme-tron-v1.html lines 670-676 */
/* ================================================================
   AMBIENT DATA PARTICLES — free-floating across page
   FIX 3: Slightly larger (4-6px) and brighter glow
   ================================================================ */

.landing-empty__ambient-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.landing-empty__ambient-particle {
  position: absolute;
  border-radius: var(--radius-full, 9999px);
  pointer-events: none;
  opacity: 0;
  z-index: 1;
}

/* Copied from design/drafts/theme-tron-v1.html lines 814-876 */
/* ================================================================
   KEYFRAMES
   FIX 3: Ambient particle drift keyframes — brighter peaks
   ================================================================ */

@keyframes particleDrift1 {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.6; }
  25%  { transform: translate(25px, -35px) scale(1.3); opacity: 0.8; }
  50%  { transform: translate(-15px, -70px) scale(0.7); opacity: 0.5; }
  75%  { transform: translate(35px, -25px) scale(1.1); opacity: 0.7; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
}

@keyframes particleDrift2 {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.5; }
  25%  { transform: translate(-35px, 18px) scale(1.2); opacity: 0.7; }
  50%  { transform: translate(8px, 45px) scale(0.6); opacity: 0.4; }
  75%  { transform: translate(-25px, -8px) scale(1.4); opacity: 0.6; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
}

@keyframes particleDrift3 {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.4; }
  25%  { transform: translate(45px, 25px) scale(1.4); opacity: 0.7; }
  50%  { transform: translate(18px, -35px) scale(0.8); opacity: 0.5; }
  75%  { transform: translate(-18px, 18px) scale(1); opacity: 0.6; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
}

@keyframes particleDrift4 {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.5; }
  25%  { transform: translate(-25px, -45px) scale(0.7); opacity: 0.4; }
  50%  { transform: translate(35px, -18px) scale(1.3); opacity: 0.6; }
  75%  { transform: translate(8px, 25px) scale(0.9); opacity: 0.5; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
}

@keyframes particleDrift5 {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.6; }
  25%  { transform: translate(18px, 35px) scale(0.6); opacity: 0.4; }
  50%  { transform: translate(-35px, 8px) scale(1.2); opacity: 0.7; }
  75%  { transform: translate(25px, -18px) scale(1.4); opacity: 0.5; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
}

@keyframes particleDrift6 {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.4; }
  25%  { transform: translate(-18px, -25px) scale(1.2); opacity: 0.6; }
  50%  { transform: translate(25px, 35px) scale(0.7); opacity: 0.5; }
  75%  { transform: translate(-35px, 8px) scale(1); opacity: 0.4; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
}

@keyframes particleDrift7 {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.5; }
  25%  { transform: translate(35px, -18px) scale(1.4); opacity: 0.7; }
  50%  { transform: translate(-8px, 45px) scale(0.8); opacity: 0.4; }
  75%  { transform: translate(18px, -35px) scale(1.1); opacity: 0.6; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
}

@keyframes particleDrift8 {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.4; }
  25%  { transform: translate(-45px, 18px) scale(0.6); opacity: 0.5; }
  50%  { transform: translate(18px, -25px) scale(1.3); opacity: 0.6; }
  75%  { transform: translate(-8px, 35px) scale(1); opacity: 0.4; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
}

/* Copied from design/drafts/theme-tron-v1.html lines 1095-1199 */
/* ================================================================
   MOTION-ALLOWED ANIMATIONS
   5. FIX 3: Ambient data particles — larger (4-6px) and brighter glow
   ================================================================ */

@media (prefers-reduced-motion: no-preference) {
  /* Particle 1: cyan, 4px, top-left */
  .landing-empty__ambient-particle--1 {
    top: 12%;
    left: 8%;
    width: 4px;
    height: 4px;
    background: var(--accent-primary);
    box-shadow: 0 0 8px var(--accent-primary-glow),
                0 0 16px rgba(0, 212, 255, 0.15);
    animation: particleDrift1 12s ease-in-out infinite;
    animation-delay: -3s;
  }

  /* Particle 2: pink, 4px, top-right */
  .landing-empty__ambient-particle--2 {
    top: 18%;
    right: 12%;
    width: 4px;
    height: 4px;
    background: var(--accent-secondary);
    box-shadow: 0 0 8px var(--accent-secondary-glow),
                0 0 16px rgba(255, 77, 106, 0.15);
    animation: particleDrift2 15s ease-in-out infinite;
    animation-delay: -7s;
  }

  /* Particle 3: cyan, 4px, mid-left */
  .landing-empty__ambient-particle--3 {
    top: 40%;
    left: 5%;
    width: 4px;
    height: 4px;
    background: var(--accent-primary);
    box-shadow: 0 0 6px var(--accent-primary-glow),
                0 0 12px rgba(0, 212, 255, 0.12);
    animation: particleDrift3 10s ease-in-out infinite;
    animation-delay: -1s;
  }

  /* Particle 4: cyan, 5px, mid-right */
  .landing-empty__ambient-particle--4 {
    top: 45%;
    right: 7%;
    width: 5px;
    height: 5px;
    background: var(--accent-primary);
    box-shadow: 0 0 8px var(--accent-primary-glow),
                0 0 16px rgba(0, 212, 255, 0.15);
    animation: particleDrift4 13s ease-in-out infinite;
    animation-delay: -5s;
  }

  /* Particle 5: cyan, 6px (larger), bottom-left */
  .landing-empty__ambient-particle--5 {
    bottom: 22%;
    left: 15%;
    width: 6px;
    height: 6px;
    background: var(--accent-primary);
    box-shadow: 0 0 10px var(--accent-primary-glow),
                0 0 20px rgba(0, 212, 255, 0.18);
    animation: particleDrift5 16s ease-in-out infinite;
    animation-delay: -9s;
  }

  /* Particle 6: cyan, 4px, bottom-right */
  .landing-empty__ambient-particle--6 {
    bottom: 18%;
    right: 18%;
    width: 4px;
    height: 4px;
    background: var(--accent-primary);
    box-shadow: 0 0 6px var(--accent-primary-glow),
                0 0 12px rgba(0, 212, 255, 0.12);
    animation: particleDrift6 9s ease-in-out infinite;
    animation-delay: -2s;
  }

  /* Particle 7: pink, 4px, upper-center-left */
  .landing-empty__ambient-particle--7 {
    top: 25%;
    left: 30%;
    width: 4px;
    height: 4px;
    background: var(--accent-secondary);
    box-shadow: 0 0 6px var(--accent-secondary-glow),
                0 0 12px rgba(255, 77, 106, 0.12);
    animation: particleDrift7 14s ease-in-out infinite;
    animation-delay: -6s;
  }

  /* Particle 8: cyan, 5px, lower-center-right */
  .landing-empty__ambient-particle--8 {
    bottom: 30%;
    right: 25%;
    width: 5px;
    height: 5px;
    background: var(--accent-primary);
    box-shadow: 0 0 8px var(--accent-primary-glow),
                0 0 16px rgba(0, 212, 255, 0.15);
    animation: particleDrift8 17s ease-in-out infinite;
    animation-delay: -11s;
  }
}

/* Copied from design/drafts/theme-tron-v1.html line 925 */
@media (prefers-reduced-motion: reduce) {
  .landing-empty__ambient-particle { display: none !important; }
}
</style>
