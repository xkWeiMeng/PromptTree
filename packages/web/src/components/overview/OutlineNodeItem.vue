<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { extractVariables } from '@prompttree/shared'
import { Folder, FolderOpen, FileText, Star, ChevronRight } from 'lucide-vue-next'

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

function getSummary(content: string, maxLen = 80): string {
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
      :style="{ paddingLeft: (level * 20 + 12) + 'px' }"
      @click="handleClick"
    >
      <!-- 展开箭头 -->
      <span
        v-if="node.type === 'folder'"
        class="expand-arrow"
        :class="{ expanded: isExpanded }"
        @click="handleToggle"
      >
        <ChevronRight :size="14" />
      </span>
      <span v-else class="expand-placeholder" />

      <!-- 图标 -->
      <component
        :is="node.type === 'folder' ? (isExpanded ? FolderOpen : Folder) : FileText"
        :size="16"
        class="node-icon"
        :class="node.type"
      />

      <!-- 信息 -->
      <div class="node-info">
        <div class="node-title">
          <span v-html="highlightText(node.title || t('common.untitled'))" />
          <Star v-if="node.isFavorite" :size="12" fill="currentColor" class="fav-star" />
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

    <!-- 子节点递归 -->
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
// 自引用递归组件需要显式命名
export default {
  name: 'OutlineNodeItem'
}
</script>

<style scoped>
.outline-node {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
  border-radius: var(--radius-sm);
  margin: 0 var(--space-2);
}

.outline-node:hover {
  background: var(--bg-hover);
}

.outline-node.is-selected {
  background: var(--accent-bg-subtle);
}

.expand-arrow {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: transform var(--duration-fast) ease;
  margin-top: 2px;
}

.expand-arrow.expanded {
  transform: rotate(90deg);
}

.expand-placeholder {
  width: 16px;
  flex-shrink: 0;
}

.node-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.node-icon.folder {
  color: var(--color-accent);
}

.node-icon.prompt {
  color: var(--text-secondary);
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.node-title :deep(mark) {
  background: var(--color-warning-bg);
  border-radius: 2px;
  padding: 0 1px;
  color: var(--text-primary);
}

.fav-star {
  color: var(--color-warning);
  flex-shrink: 0;
}

.node-summary {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
  line-height: var(--line-height-normal);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-vars {
  display: inline-block;
  font-size: 11px;
  color: var(--color-accent);
  background: var(--accent-bg-subtle);
  padding: 1px var(--space-1);
  border-radius: var(--radius-xs);
  margin-top: var(--space-1);
  font-weight: var(--font-weight-medium);
}

.node-count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}
</style>
