<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { TreeNodeWithChildren } from '@prompttree/shared'

const props = defineProps<{
  node: TreeNodeWithChildren
  level: number
  mode: 'tree' | 'drill' // 树模式 或 层级下钻模式
  expandedIds: Set<string>
  selectedId: string | null
  editingId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'toggle', id: string): void
  (e: 'drill', id: string): void
  (e: 'contextmenu', event: MouseEvent, id: string): void
  (e: 'rename', id: string, title: string): void
  (e: 'cancelRename'): void
}>()

const isFolder = props.node.type === 'folder'
const isExpanded = props.expandedIds.has(props.node.id)

// 行内重命名
const renameInput = ref<HTMLInputElement | null>(null)
const renameTitle = ref('')

watch(() => props.editingId, (newId) => {
  if (newId === props.node.id) {
    renameTitle.value = props.node.title || ''
    nextTick(() => {
      renameInput.value?.focus()
      renameInput.value?.select()
    })
  }
})

function commitRename() {
  const t = renameTitle.value.trim()
  if (t && t !== props.node.title) {
    emit('rename', props.node.id, t)
  } else {
    emit('cancelRename')
  }
}

function handleRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    commitRename()
  } else if (e.key === 'Escape') {
    emit('cancelRename')
  }
}

function handleClick() {
  if (props.editingId === props.node.id) return
  if (isFolder && props.mode === 'drill') {
    emit('drill', props.node.id)
  } else if (isFolder && props.mode === 'tree') {
    emit('toggle', props.node.id)
  } else {
    emit('select', props.node.id)
  }
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault()
  emit('contextmenu', e, props.node.id)
}
</script>

<template>
  <div class="tree-node-wrapper">
    <div
      :class="['tree-node', { 'tree-node--selected': selectedId === node.id }]"
      :style="mode === 'tree' ? { paddingLeft: `${12 + level * 16}px` } : {}"
      @click="handleClick"
      @contextmenu="handleContextMenu"
    >
      <!-- 展开/折叠箭头（仅树模式文件夹） -->
      <span
        v-if="isFolder && mode === 'tree'"
        class="tree-arrow"
        @click.stop="$emit('toggle', node.id)"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else-if="mode === 'tree'" class="tree-arrow-placeholder" />

      <!-- 图标 -->
      <span class="tree-icon">{{ isFolder ? '📁' : '📄' }}</span>

      <!-- 标题 or 行内编辑 -->
      <input
        v-if="editingId === node.id"
        ref="renameInput"
        v-model="renameTitle"
        class="tree-rename-input"
        @blur="commitRename"
        @keydown="handleRenameKeydown"
        @click.stop
      />
      <span v-else class="tree-title">{{ node.title || $t('common.untitled') }}</span>

      <!-- 收藏标记 -->
      <span v-if="node.isFavorite" class="tree-fav">⭐</span>

      <!-- 层级模式文件夹右箭头 -->
      <span v-if="isFolder && mode === 'drill'" class="tree-chevron">›</span>
    </div>

    <!-- 树模式递归子节点 -->
    <template v-if="mode === 'tree' && isFolder && isExpanded && node.children.length > 0">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :mode="mode"
        :expanded-ids="expandedIds"
        :selected-id="selectedId"
        :editing-id="editingId"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @drill="$emit('drill', $event)"
        @contextmenu="(ev, id) => $emit('contextmenu', ev, id)"
        @rename="(id, title) => $emit('rename', id, title)"
        @cancel-rename="$emit('cancelRename')"
      />
    </template>
  </div>
</template>

<script lang="ts">
export default { name: 'TreeNode' }
</script>

<style scoped>
.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  user-select: none;
  transition: background 0.15s;
}

.tree-node:hover {
  background: var(--color-hover, #f3f4f6);
}

.tree-node--selected {
  background: var(--color-selected, #ede9fe);
}

.tree-arrow {
  font-size: 9px;
  width: 14px;
  text-align: center;
  color: var(--color-text-secondary, #9ca3af);
  flex-shrink: 0;
  cursor: pointer;
}

.tree-arrow-placeholder {
  width: 14px;
  flex-shrink: 0;
}

.tree-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tree-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text, #1f2937);
}

.tree-rename-input {
  flex: 1;
  border: 1px solid var(--color-primary, #4f46e5);
  border-radius: 4px;
  padding: 1px 4px;
  font-size: 13px;
  outline: none;
  background: var(--color-bg, #fff);
  color: var(--color-text, #1f2937);
  min-width: 0;
}

.tree-fav {
  font-size: 11px;
  flex-shrink: 0;
}

.tree-chevron {
  color: var(--color-text-secondary, #9ca3af);
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
}
</style>
