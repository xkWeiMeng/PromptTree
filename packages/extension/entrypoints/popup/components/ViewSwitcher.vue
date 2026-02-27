<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ViewMode } from '@/stores/tree'

const { t } = useI18n()

defineProps<{
  modelValue: ViewMode
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ViewMode): void
}>()

const modes: { value: ViewMode; icon: string; labelKey: string }[] = [
  { value: 'drill', icon: '📂', labelKey: 'tree.drillMode' },
  { value: 'tree', icon: '🌳', labelKey: 'tree.treeMode' },
  { value: 'outline', icon: '📋', labelKey: 'view.outline' },
  { value: 'mindmap', icon: '🧠', labelKey: 'view.mindmap' },
]
</script>

<template>
  <div class="view-switcher">
    <button
      v-for="mode in modes"
      :key="mode.value"
      :class="['switch-btn', { active: modelValue === mode.value }]"
      @click="emit('update:modelValue', mode.value)"
    >
      <span class="switch-icon">{{ mode.icon }}</span>
      <span class="switch-label">{{ t(mode.labelKey) }}</span>
    </button>
  </div>
</template>

<style scoped>
.view-switcher {
  display: flex;
  gap: 0;
  padding: 0 8px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.switch-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
  font-size: 11px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-secondary, #9ca3af);
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.switch-btn.active {
  color: var(--color-primary, #4f46e5);
  border-bottom-color: var(--color-primary, #4f46e5);
}

.switch-btn:hover:not(.active) {
  color: var(--color-text, #1f2937);
  background: var(--color-hover, #f3f4f6);
}

.switch-icon {
  font-size: 12px;
}

.switch-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
