<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTreeStore } from '@/stores/tree'
import type { ViewMode } from '@/stores/tree'
import { Pencil, List, Network } from 'lucide-vue-next'
import { markRaw, type Component } from 'vue'

const { t } = useI18n()
const treeStore = useTreeStore()

const isMac = typeof window !== 'undefined' && window.navigator.userAgent.includes('Mac')

const hasSelectedPrompt = computed(() => {
  return treeStore.selectedNode?.type === 'prompt'
})

const tabs = computed<{ mode: ViewMode; icon: Component; label: string; description: string }[]>(() => [
  { mode: 'editor', icon: markRaw(Pencil), label: t('view.editor'), description: t('view.editorDesc') },
  { mode: 'outline', icon: markRaw(List), label: t('view.outline'), description: t('view.outlineDesc') },
  { mode: 'mindmap', icon: markRaw(Network), label: t('view.mindmap'), description: t('view.mindmapDesc') }
])

function switchView(mode: ViewMode) {
  if (mode === 'editor' && !hasSelectedPrompt.value) return
  treeStore.setViewMode(mode)
}
</script>

<template>
  <div class="view-switcher">
    <div class="switcher-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.mode"
        role="tab"
        class="tab-btn"
        :class="{
          active: treeStore.viewMode === tab.mode,
          disabled: tab.mode === 'editor' && !hasSelectedPrompt
        }"
        :aria-selected="treeStore.viewMode === tab.mode"
        :aria-disabled="tab.mode === 'editor' && !hasSelectedPrompt ? true : undefined"
        :title="tab.mode === 'editor' && !hasSelectedPrompt ? t('view.editorDisabledHint') : tab.description"
        @click="switchView(tab.mode)"
      >
        <component :is="tab.icon" :size="14" class="tab-icon" />
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <div class="switcher-shortcuts">
      <span class="shortcut-hint" v-if="treeStore.viewMode === 'editor'">
        <kbd>Esc</kbd> {{ t('common.close') }}
      </span>
      <span class="shortcut-hint" v-else-if="treeStore.viewMode !== 'welcome'">
        <kbd>{{ isMac ? '⌘' : 'Ctrl' }}</kbd>+<kbd>Shift</kbd>+<kbd>{{ treeStore.viewMode === 'outline' ? 'O' : 'M' }}</kbd>
      </span>
    </div>
  </div>
</template>

<style scoped>
.view-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-4);
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
}

.switcher-tabs {
  display: flex;
  gap: 1px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 2px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  transition: all var(--duration-fast) ease;
  white-space: nowrap;
}

.tab-btn:hover:not(.disabled) {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-xs);
  font-weight: var(--font-weight-medium);
}

.tab-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.tab-icon {
  flex-shrink: 0;
}

.tab-label {
  font-size: var(--font-size-xs);
}

.switcher-shortcuts {
  display: flex;
  align-items: center;
}

.shortcut-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
