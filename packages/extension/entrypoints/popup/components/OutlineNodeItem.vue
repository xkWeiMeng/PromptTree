<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { extractVariables } from '@prompttree/shared'

const { t } = useI18n()

const props = defineProps<{
  node: TreeNodeWithChildren
  level: number
  expandedIds: Set<string>
  selectedId: string | null
  searchQuery: string
}>()

const emit = defineEmits<{
  (e: 'click', node: TreeNodeWithChildren): void
  (e: 'toggle', id: string): void
}>()

const isExpanded = computed(() => props.expandedIds.has(props.node.id))

function handleClick() {
  emit('click', props.node)
}

function handleToggle(e: Event) {
  e.stopPropagation()
  emit('toggle', props.node.id)
}

function highlightText(text: string): string {
  if (!props.searchQuery) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const regex = new RegExp(`(${props.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return escaped.replace(regex, '<mark>$1</mark>')
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function getSummary(content: string, maxLen = 60): string {
  if (!content) return ''
  const text = content.replace(/\{\{[^}]+\}\}/g, t('outline.variableTag')).replace(/\n/g, ' ')
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function getVarCount(content: string): number {
  return content ? extractVariables(content).length : 0
}
</script>

<template>
  <div class="outline-node-wrapper">
    <div
      class="outline-node"
      :class="{
        'is-folder': node.type === 'folder',
        'is-prompt': node.type === 'prompt',
        'is-selected': node.id === selectedId,
        'is-favorite': node.isFavorite
      }"
      :style="{ paddingLeft: (level * 16 + 8) + 'px' }"
      @click="handleClick"
    >
      <span
        v-if="node.type === 'folder'"
        class="expand-arrow"
        :class="{ expanded: isExpanded }"
        @click="handleToggle"
      >▸</span>
      <span v-else class="expand-placeholder" />

      <span class="node-icon">{{ node.type === 'folder' ? (isExpanded ? '📂' : '📁') : '📄' }}</span>

      <div class="node-info">
        <div class="node-title">
          <span v-html="highlightText(node.title || $t('common.untitled'))" />
          <span v-if="node.isFavorite" class="fav-star">⭐</span>
        </div>
        <div v-if="node.type === 'prompt' && node.content" class="node-summary">
          {{ getSummary(node.content) }}
        </div>
        <div v-if="node.type === 'prompt' && getVarCount(node.content) > 0" class="node-vars">
          {{ t('outline.varCount', { count: getVarCount(node.content) }) }}
        </div>
        <div v-if="node.type === 'folder'" class="node-count">
          {{ t('outline.items', { count: node.children.length }) }}
        </div>
      </div>
    </div>

    <div v-if="node.type === 'folder' && isExpanded && node.children.length > 0" class="outline-children">
      <OutlineNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :expanded-ids="expandedIds"
        :selected-id="selectedId"
        :search-query="searchQuery"
        @click="(n: TreeNodeWithChildren) => emit('click', n)"
        @toggle="(id: string) => emit('toggle', id)"
      />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'OutlineNodeItem'
}
</script>

<style scoped>
.outline-node {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 4px;
  margin: 0 4px;
  transition: background 0.1s;
}

.outline-node:hover {
  background: var(--color-hover, #f3f4f6);
}

.outline-node.is-selected {
  background: var(--color-selected, #ede9fe);
}

.expand-arrow {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--color-text-secondary, #9ca3af);
  transition: transform 0.15s;
  margin-top: 2px;
  cursor: pointer;
}

.expand-arrow.expanded {
  transform: rotate(90deg);
}

.expand-placeholder {
  width: 14px;
  flex-shrink: 0;
}

.node-icon {
  flex-shrink: 0;
  font-size: 13px;
  margin-top: 1px;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text, #1f2937);
  display: flex;
  align-items: center;
  gap: 4px;
}

.node-title :deep(mark) {
  background: #fef08a;
  border-radius: 2px;
  padding: 0 1px;
}

.fav-star {
  font-size: 10px;
}

.node-summary {
  font-size: 11px;
  color: var(--color-text-secondary, #9ca3af);
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-vars {
  display: inline-block;
  font-size: 10px;
  color: var(--color-primary, #4f46e5);
  background: #ede9fe;
  padding: 0 4px;
  border-radius: 3px;
  margin-top: 2px;
  font-weight: 500;
}

.node-count {
  font-size: 11px;
  color: var(--color-text-secondary, #9ca3af);
  margin-top: 1px;
}
</style>
