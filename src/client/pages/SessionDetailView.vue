<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SessionContent from '../components/SessionContent.vue';
import SkeletonMain from '../components/SkeletonMain.vue';
import { useSession } from '../composables/useSession.js';

/**
 * SessionDetailView renders a session's content in the spatial shell main area.
 * Breadcrumb is handled by ShellHeader — this component only renders content.
 * Loading state delegates to SkeletonMain; error state is styled inline.
 */

const route = useRoute();
const sessionId = computed(() => route.params.id as string);
const { sections, snapshot, loading, error } = useSession(sessionId);

/** True when there is renderable content (sections or a top-level snapshot). */
const hasContent = computed(() => sections.value.length > 0 || snapshot.value !== null);
</script>

<template>
  <div class="session-detail-view">
    <SkeletonMain v-if="loading" />
    <div
      v-else-if="error"
      class="session-detail-view__state session-detail-view__state--error"
    >
      {{ error }}
    </div>
    <div
      v-else-if="!hasContent"
      class="session-detail-view__state"
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

<style scoped>
/**
 * SessionDetailView fills the spatial-shell main grid area directly.
 * No container wrapper — the shell provides the grid context.
 */
.session-detail-view {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  padding: var(--space-6);
}

.session-detail-view__state {
  text-align: center;
  padding: var(--space-12);
  color: var(--text-muted);
}

.session-detail-view__state--error {
  color: var(--status-error);
}
</style>
