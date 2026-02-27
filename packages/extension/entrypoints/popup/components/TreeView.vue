<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTreeStore } from '@/stores/tree'
import { buildTree } from '@prompttree/shared'
import TreeNode from './TreeNode.vue'

const { t } = useI18n()

const props = defineProps<{
  mode: 'tree' | 'drill'
}>()

const emit = defineEmits<{
  (e: 'contextmenu', event: MouseEvent, id: string): void
  (e: 'rename', id: string, title: string): void
  (e: 'cancelRename'): void
}>()

const treeStore = useTreeStore()

/** 层级模式：当前文件夹下节点构建为树（一层） */
const displayNodes = computed(() => {
  if (props.mode === 'drill') {
    const children = treeStore.currentFolderNodes
    return children.map(n => ({ ...n, children: [] }))
  }
  return treeStore.rootNodes
})

function handleSelect(id: string) {
  treeStore.selectNode(id)
}

function handleToggle(id: string) {
  treeStore.toggleExpanded(id)
}

function handleDrill(id: string) {
  treeStore.navigateToFolder(id)
}

function handleContextMenu(event: MouseEvent, id: string) {
  emit('contextmenu', event, id)
}
</script>

<template>
  <div class="tree-view">
    <!-- 面包屑（层级模式） -->
    <div v-if="mode === 'drill' && treeStore.breadcrumb.length > 0" class="breadcrumb">
      <span class="breadcrumb-item" @click="treeStore.navigateToFolder(null)">🏠</span>
      <template v-for="(crumb, i) in treeStore.breadcrumb" :key="crumb.id">
        <span class="breadcrumb-sep">/</span>
        <span
          class="breadcrumb-item"
          :class="{ 'breadcrumb-item--current': i === treeStore.breadcrumb.length - 1 }"
          @click="treeStore.navigateToFolder(crumb.id)"
        >
          {{ crumb.title || $t('common.untitled') }}
        </span>
      </template>
    </div>

    <!-- 返回上级（层级模式 & 非根） -->
    <div
      v-if="mode === 'drill' && treeStore.currentFolderId"
      class="back-btn"
      @click="treeStore.navigateUp()"
    >
      ← {{ t('tree.backToParent') }}
    </div>

    <!-- 节点列表 -->
    <div class="tree-list">
      <TreeNode
        v-for="node in displayNodes"
        :key="node.id"
        :node="node"
        :level="0"
        :mode="mode"
        :expanded-ids="treeStore.expandedIds"
        :selected-id="treeStore.selectedNodeId"
        :editing-id="treeStore.editingNodeId"
        @select="handleSelect"
        @toggle="handleToggle"
        @drill="handleDrill"
        @contextmenu="handleContextMenu"
        @rename="(id, title) => emit('rename', id, title)"
        @cancel-rename="emit('cancelRename')"
      />

      <!-- 空状态 -->
      <div v-if="displayNodes.length === 0" class="empty-state">
        <p>📝</p>
        <p>{{ t('tree.emptyState') }}</p>
        <p class="empty-hint">{{ t('tree.emptyHint') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tree-view {
  flex: 1;
  overflow-y: auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--color-text-secondary, #9ca3af);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  flex-wrap: wrap;
}

.breadcrumb-item {
  cursor: pointer;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb-item:hover {
  color: var(--color-primary, #4f46e5);
}

.breadcrumb-item--current {
  color: var(--color-text, #1f2937);
  font-weight: 500;
}

.breadcrumb-sep {
  margin: 0 2px;
}

.back-btn {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--color-primary, #4f46e5);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.back-btn:hover {
  background: var(--color-hover, #f3f4f6);
}

.tree-list {
  padding: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: var(--color-text-secondary, #9ca3af);
}

.empty-state p:first-child {
  font-size: 32px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  margin-top: 4px;
}
</style>
