<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SessionContent from '../components/SessionContent.vue';
import { useSession } from '../composables/useSession';

const route = useRoute();
const sessionId = computed(() => route.params.id as string);
const { sections, snapshot, loading, error, filename } = useSession(sessionId);
</script>

<template>
  <div class="session-detail-page container">
    <!-- Real header — only when not loading -->
    <header
      v-if="!loading"
      class="session-detail-page__header"
    >
      <nav class="breadcrumb">
        <router-link
          to="/"
          class="breadcrumb__link"
        >
          Sessions
        </router-link>
        <span class="breadcrumb__separator">
          <span class="icon icon--xs icon-chevron-right" />
        </span>
        <span
          v-if="filename"
          class="breadcrumb__current"
        >
          {{ filename }}
        </span>
      </nav>
    </header>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <!-- Page Header with skeleton breadcrumb + filename -->
      <div class="detail-header">
        <div class="detail-skeleton__breadcrumb">
          <div class="skeleton detail-skeleton__breadcrumb-item" />
          <div class="skeleton detail-skeleton__breadcrumb-sep" />
          <div class="skeleton detail-skeleton__breadcrumb-current" />
        </div>
        <div class="detail-header__top">
          <div class="detail-header__title-row">
            <div class="skeleton detail-skeleton__filename" />
            <div class="skeleton detail-skeleton__badge" />
          </div>
          <div class="detail-skeleton__nav">
            <div class="skeleton detail-skeleton__nav-btn" />
            <div class="skeleton detail-skeleton__nav-btn" />
          </div>
        </div>
      </div>

      <!-- Terminal viewer with skeleton content -->
      <div class="detail-viewer">
        <div class="terminal-chrome">
          <div class="terminal-chrome__titlebar">
            <div class="terminal-chrome__dots">
              <span class="terminal-chrome__dot" />
              <span class="terminal-chrome__dot" />
              <span class="terminal-chrome__dot" />
            </div>
            <span class="terminal-chrome__title">&nbsp;</span>
            <div class="detail-skeleton__meta">
              <div class="skeleton detail-skeleton__meta-item" />
              <div class="skeleton detail-skeleton__meta-item" />
              <div class="skeleton detail-skeleton__meta-item" />
            </div>
          </div>
          <div class="terminal-chrome__body">
            <!-- Section header 1 -->
            <div class="detail-skeleton__section-header">
              <div class="skeleton detail-skeleton__section-chevron" />
              <div class="skeleton detail-skeleton__section-label" />
              <div class="skeleton detail-skeleton__section-badge" />
              <div class="skeleton detail-skeleton__section-range" />
            </div>
            <!-- Lines block 1 -->
            <div class="detail-skeleton__lines">
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 85%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 40%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 72%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 55%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 68%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 30%;"
                />
              </div>
            </div>
            <!-- Section header 2 -->
            <div
              class="detail-skeleton__section-header"
              style="margin-top: var(--space-3);"
            >
              <div class="skeleton detail-skeleton__section-chevron" />
              <div
                class="skeleton detail-skeleton__section-label"
                style="max-width: 160px;"
              />
              <div class="skeleton detail-skeleton__section-badge" />
              <div class="skeleton detail-skeleton__section-range" />
            </div>
            <!-- Lines block 2 -->
            <div class="detail-skeleton__lines">
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 60%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 78%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 45%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 90%;"
                />
              </div>
            </div>
            <!-- Section header 3 -->
            <div
              class="detail-skeleton__section-header"
              style="margin-top: var(--space-3);"
            >
              <div class="skeleton detail-skeleton__section-chevron" />
              <div
                class="skeleton detail-skeleton__section-label"
                style="max-width: 240px;"
              />
              <div class="skeleton detail-skeleton__section-badge" />
              <div class="skeleton detail-skeleton__section-range" />
            </div>
            <!-- Lines block 3 -->
            <div class="detail-skeleton__lines">
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 50%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 65%;"
                />
              </div>
              <div class="detail-skeleton__line-row">
                <div class="skeleton detail-skeleton__line-no" />
                <div
                  class="skeleton detail-skeleton__line-text"
                  style="width: 35%;"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div
      v-else-if="error"
      class="session-detail-page__state session-detail-page__state--error"
    >
      {{ error }}
    </div>
    <div
      v-else-if="sections.length === 0 && !snapshot"
      class="session-detail-page__state"
    >
      This session has no content.
    </div>
    <SessionContent
      v-else
      :snapshot="snapshot"
      :sections="sections"
      :default-collapsed="false"
    />
  </div>
</template>

<style>
/* ================================================================
   Session Detail Page — Loading Skeleton
   Skeleton placeholders matching session-detail.html layout.
   Page-specific layout styles only. No token redefinitions.
   ================================================================ */

/* Page header row */
.detail-header {
  max-width: var(--container-max);
  width: 100%;
  margin: 0 auto;
  padding: var(--space-5) var(--container-padding);
}

.detail-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.detail-header__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Terminal viewer fills remaining space */
.detail-viewer {
  flex: 1;
  max-width: var(--container-max);
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--container-padding) var(--space-8);
}

.detail-viewer .terminal-chrome {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 180px);
}

.detail-viewer .terminal-chrome__body {
  flex: 1;
  padding: var(--space-5);
}

/* Skeleton breadcrumb */
.detail-skeleton__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.detail-skeleton__breadcrumb-item {
  width: 64px;
  height: var(--space-3);
}

.detail-skeleton__breadcrumb-sep {
  width: var(--space-3);
  height: var(--space-3);
}

.detail-skeleton__breadcrumb-current {
  width: 180px;
  height: var(--space-3);
}

/* Skeleton filename + badge */
.detail-skeleton__filename {
  width: 260px;
  height: var(--space-5);
}

.detail-skeleton__badge {
  width: 90px;
  height: var(--space-5);
  border-radius: var(--radius-full);
}

/* Skeleton nav arrows placeholder */
.detail-skeleton__nav {
  display: flex;
  gap: var(--space-1);
}

.detail-skeleton__nav-btn {
  width: var(--space-8);
  height: var(--space-8);
  border-radius: var(--radius-md);
}

/* Skeleton terminal lines */
.detail-skeleton__lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-skeleton__line-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.detail-skeleton__line-no {
  width: 28px;
  height: var(--space-3);
  flex-shrink: 0;
}

.detail-skeleton__line-text {
  height: var(--space-3);
}

/* Skeleton section header */
.detail-skeleton__section-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
}

.detail-skeleton__section-chevron {
  width: var(--space-5);
  height: var(--space-5);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.detail-skeleton__section-label {
  height: var(--space-3);
  flex: 1;
  max-width: 200px;
}

.detail-skeleton__section-badge {
  width: 60px;
  height: var(--space-5);
  border-radius: var(--radius-full);
}

.detail-skeleton__section-range {
  width: 44px;
  height: var(--space-3);
}

/* Titlebar skeleton meta */
.detail-skeleton__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.detail-skeleton__meta-item {
  width: 56px;
  height: var(--space-3);
}

@media (max-width: 767px) {
  .detail-header {
    padding: var(--space-4) var(--space-4);
  }

  .detail-header__top {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .detail-viewer {
    padding: 0 var(--space-4) var(--space-4);
  }
}
</style>

<style scoped>
.session-detail-page {
  padding: var(--space-6) var(--container-padding);
}

.session-detail-page__header {
  margin-bottom: var(--space-6);
}

.session-detail-page__state {
  text-align: center;
  padding: var(--space-12);
  color: var(--text-muted);
}

.session-detail-page__state--error {
  color: var(--status-error);
}
</style>
