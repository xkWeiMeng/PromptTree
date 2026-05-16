<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import { Folder, FolderOpen, FileText, Star } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps<{
  node: TreeNodeWithChildren
  level: number
}>()

const emit = defineEmits<{
  (e: 'contextmenu', event: MouseEvent, node: TreeNodeWithChildren): void
}>()

const treeStore = useTreeStore()

// 计算属性
const isExpanded = computed(() => treeStore.expandedIds.has(props.node.id))
const isSelected = computed(() => treeStore.selectedNodeId === props.node.id)
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)
const isFolder = computed(() => props.node.type === 'folder')
const isEditing = computed(() => treeStore.editingNodeId === props.node.id)
const isDirty = computed(() => (props.node as any)._dirty === true)

// Drop zone state
const dropPosition = ref<'above' | 'inside' | 'below' | null>(null)

// 重命名输入
const renameInput = ref<HTMLInputElement | null>(null)
const renameText = ref('')

// 当进入编辑状态时，初始化文本并聚焦
watch(isEditing, async (editing) => {
  if (editing) {
    renameText.value = props.node.title || ''
    await nextTick()
    renameInput.value?.focus()
    renameInput.value?.select()
  }
})

// 提交重命名
async function submitRename() {
  const newTitle = renameText.value.trim()
  if (newTitle && newTitle !== props.node.title) {
    await treeStore.updateNode(props.node.id, { title: newTitle })
  }
  treeStore.stopEditing()
}

// 取消重命名
function cancelRename() {
  treeStore.stopEditing()
}

// 重命名 keydown 处理
function handleRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    submitRename()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelRename()
  }
}

// 节点缩进
const indent = computed(() => `${props.level * 16}px`)

// 点击处理
function handleClick() {
  treeStore.selectNode(props.node.id)
}

// 双击展开/折叠
function handleDblClick() {
  if (isFolder.value) {
    treeStore.toggleExpanded(props.node.id)
  }
}

// 展开/折叠按钮
function handleToggle(e: Event) {
  e.stopPropagation()
  treeStore.toggleExpanded(props.node.id)
}

// 右键菜单
function handleContextMenu(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('contextmenu', e, props.node)
}

// 拖拽开始
function handleDragStart(e: DragEvent) {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', props.node.id)
  const target = e.target as HTMLElement
  target.classList.add('dragging')
}

// 拖拽结束
function handleDragEnd(e: DragEvent) {
  const target = e.target as HTMLElement
  target.classList.remove('dragging')
}

// 拖拽经过（带位置检测）
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (!e.dataTransfer) return
  e.dataTransfer.dropEffect = 'move'

  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const y = e.clientY - rect.top
  const height = rect.height

  if (y < height * 0.25) {
    dropPosition.value = 'above'
  } else if (y > height * 0.75) {
    dropPosition.value = 'below'
  } else {
    dropPosition.value = isFolder.value ? 'inside' : (y < height * 0.5 ? 'above' : 'below')
  }
}

// 拖拽离开
function handleDragLeave(e: DragEvent) {
  const related = e.relatedTarget as HTMLElement | null
  const target = e.currentTarget as HTMLElement
  if (!related || !target.contains(related)) {
    dropPosition.value = null
  }
}

// 放置
function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId || draggedId === props.node.id) {
    dropPosition.value = null
    return
  }

  let newParentId: string | null
  let newSortOrder: number

  if (dropPosition.value === 'inside' && isFolder.value) {
    newParentId = props.node.id
    newSortOrder = 0
  } else if (dropPosition.value === 'above') {
    newParentId = props.node.parentId
    newSortOrder = props.node.sortOrder
  } else {
    newParentId = props.node.parentId
    newSortOrder = props.node.sortOrder + 1
  }

  dropPosition.value = null
  treeStore.moveNode(draggedId, newParentId, newSortOrder)
}
</script>

<template>
  <div class="tree-node-wrapper">
    <div
      class="tree-node"
      :class="{
        selected: isSelected,
        folder: isFolder,
        'tree-node--drop-target': dropPosition === 'inside',
        'tree-node--drop-above': dropPosition === 'above',
        'tree-node--drop-below': dropPosition === 'below'
      }"
      :style="{ paddingLeft: indent }"
      role="treeitem"
      :aria-expanded="isFolder ? isExpanded : undefined"
      :aria-selected="isSelected"
      aria-roledescription="draggable item"
      :draggable="true"
      @click="handleClick"
      @dblclick="handleDblClick"
      @contextmenu="handleContextMenu"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- 展开/折叠箭头 -->
      <span
        class="toggle"
        :class="{ expanded: isExpanded, hidden: !isFolder }"
        role="button"
        tabindex="0"
        :aria-expanded="isFolder ? isExpanded : undefined"
        :aria-label="isFolder ? (isExpanded ? t('tree.collapseFolder') : t('tree.expandFolder')) : undefined"
        @click="handleToggle"
        @keydown.enter.prevent="handleToggle"
        @keydown.space.prevent="handleToggle"
      >
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
        </svg>
      </span>
      
      <!-- 图标 -->
      <component 
        :is="isFolder ? (isExpanded ? FolderOpen : Folder) : FileText"
        :size="15"
        class="node-icon"
        :class="{ 'folder-icon': isFolder, 'file-icon': !isFolder }"
      />
      
      <!-- 标题（编辑模式） -->
      <input
        v-if="isEditing"
        ref="renameInput"
        v-model="renameText"
        class="rename-input"
        @blur="submitRename"
        @keydown="handleRenameKeydown"
        @click.stop
        @dblclick.stop
      />
      <!-- 标题（普通模式） -->
      <span v-else class="title" :title="node.title">{{ node.title || t('common.untitled') }}</span>

      <!-- 脏标记（待同步） -->
      <span v-if="isDirty" class="dirty-indicator" :title="t('sync.pendingSync', { count: 1 })">•</span>
      
      <!-- 收藏标记 -->
      <Star v-if="node.isFavorite" :size="12" class="favorite" fill="currentColor" />
    </div>
    
    <!-- 子节点 -->
    <div v-if="isFolder && isExpanded && hasChildren" class="children" role="group">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        @contextmenu="(e, n) => emit('contextmenu', e, n)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px var(--space-2);
  cursor: pointer;
  user-select: none;
  border-radius: var(--radius-sm);
  margin: 0 var(--space-1);
  transition: background-color var(--duration-fast) ease;
}

.tree-node:hover {
  background-color: var(--bg-hover);
}

.tree-node.selected {
  background-color: var(--accent-bg-subtle);
}

.tree-node.dragging {
  opacity: 0.4;
}

.toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: var(--text-tertiary);
  transition: transform var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.toggle.expanded {
  transform: rotate(90deg);
}

.toggle.hidden {
  visibility: hidden;
}

.toggle:hover {
  color: var(--text-secondary);
}

.node-icon {
  flex-shrink: 0;
}

.folder-icon {
  color: var(--color-accent);
}

.file-icon {
  color: var(--text-secondary);
}

.title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing-normal);
}

.favorite {
  color: var(--color-warning);
  flex-shrink: 0;
}

.rename-input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-xs);
  padding: 0 var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  outline: none;
  line-height: 1.6;
}

.rename-input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -1px;
}

.children {
  /* 子节点容器 */
}

/* Drop zone indicators */
.tree-node--drop-target {
  background: var(--accent-bg-subtle, rgba(0, 122, 255, 0.08));
  border-radius: var(--radius-sm);
  outline: 2px dashed var(--color-accent);
  outline-offset: -2px;
}

.tree-node--drop-above::before,
.tree-node--drop-below::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-accent);
  pointer-events: none;
}

.tree-node--drop-above::before { top: 0; }
.tree-node--drop-below::after { bottom: 0; }

/* Dirty indicator */
.dirty-indicator {
  color: var(--text-tertiary);
  font-size: 10px;
  line-height: 1;
  flex-shrink: 0;
}
</style>
