<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import { useConfirm } from '@/composables/useConfirm'
import TreeNode from './TreeNode.vue'
import {
  FolderPlus, FilePlus, Star, StarOff, Trash2, FolderOpen, Pencil, Share2
} from 'lucide-vue-next'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'create', type: 'folder' | 'prompt', parentId: string | null): void
  (e: 'share', nodeId: string): void
}>()

const treeStore = useTreeStore()
const { confirm } = useConfirm()

// 根节点列表
const rootNodes = computed(() => treeStore.rootNodes)

// 右键菜单状态
const contextMenu = ref<{
  visible: boolean
  x: number
  y: number
  node: TreeNodeWithChildren | null
}>({
  visible: false,
  x: 0,
  y: 0,
  node: null
})

// 显示右键菜单
function showContextMenu(e: MouseEvent, node: TreeNodeWithChildren) {
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    node
  }
}

// 隐藏右键菜单
function hideContextMenu() {
  contextMenu.value.visible = false
}

// 创建子节点
function handleCreateChild(type: 'folder' | 'prompt') {
  if (contextMenu.value.node) {
    emit('create', type, contextMenu.value.node.id)
  }
  hideContextMenu()
}

// 删除节点
async function handleDelete() {
  if (contextMenu.value.node) {
    const nodeName = contextMenu.value.node.title || t('common.untitled')
    const confirmed = await confirm({
      title: t('tree.deleteConfirmTitle'),
      message: t('tree.deleteConfirmMsg', { name: nodeName }),
      type: 'danger',
      confirmText: t('common.delete'),
      cancelText: t('common.cancel')
    })
    if (confirmed) {
      await treeStore.deleteNode(contextMenu.value.node.id)
    }
  }
  hideContextMenu()
}

// 重命名节点
function handleRename() {
  if (contextMenu.value.node) {
    treeStore.startEditing(contextMenu.value.node.id)
  }
  hideContextMenu()
}

// 切换收藏
async function handleToggleFavorite() {
  if (contextMenu.value.node) {
    await treeStore.toggleFavorite(contextMenu.value.node.id)
  }
  hideContextMenu()
}

// 分享节点
function handleShare() {
  if (contextMenu.value.node) {
    emit('share', contextMenu.value.node.id)
  }
  hideContextMenu()
}

// 在空白处右键
function handleEmptyContextMenu(e: MouseEvent) {
  e.preventDefault()
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    node: null
  }
}

// 创建根节点
function handleCreateRoot(type: 'folder' | 'prompt') {
  emit('create', type, null)
  hideContextMenu()
}
</script>

<template>
  <div class="tree-view" @click="hideContextMenu" @contextmenu="handleEmptyContextMenu">
    <!-- 空状态 -->
    <div v-if="rootNodes.length === 0" class="empty-state">
      <FolderOpen :size="40" class="empty-icon" />
      <p>{{ t('tree.emptyState') }}</p>
      <p class="hint">{{ t('tree.emptyHint') }}</p>
    </div>
    
    <!-- 树节点列表 -->
    <div v-else class="tree-list">
      <TreeNode
        v-for="node in rootNodes"
        :key="node.id"
        :node="node"
        :level="0"
        @contextmenu="showContextMenu"
      />
    </div>
    
    <!-- 右键菜单 -->
    <Teleport to="body">
      <Transition name="menu">
        <div
          v-if="contextMenu.visible"
          class="context-menu"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
          @click.stop
        >
          <template v-if="contextMenu.node">
            <!-- 节点右键菜单 -->
            <div
              v-if="contextMenu.node.type === 'folder'"
              class="menu-item"
              @click="handleCreateChild('folder')"
            >
              <FolderPlus :size="15" />
              <span>{{ t('tree.newFolder') }}</span>
            </div>
            <div
              v-if="contextMenu.node.type === 'folder'"
              class="menu-item"
              @click="handleCreateChild('prompt')"
            >
              <FilePlus :size="15" />
              <span>{{ t('tree.newPrompt') }}</span>
            </div>
            <div class="menu-divider" v-if="contextMenu.node.type === 'folder'"></div>
            <div class="menu-item" @click="handleRename">
              <Pencil :size="15" />
              <span>{{ t('tree.rename') }}</span>
            </div>
            <div class="menu-item" @click="handleToggleFavorite">
              <component :is="contextMenu.node.isFavorite ? StarOff : Star" :size="15" />
              <span>{{ contextMenu.node.isFavorite ? t('tree.unfavorite') : t('tree.addFavorite') }}</span>
            </div>
            <div class="menu-item" @click="handleShare">
              <Share2 :size="15" />
              <span>{{ t('share.action') }}</span>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item danger" @click="handleDelete">
              <Trash2 :size="15" />
              <span>{{ t('common.delete') }}</span>
            </div>
          </template>
          <template v-else>
            <!-- 空白处右键菜单 -->
            <div class="menu-item" @click="handleCreateRoot('folder')">
              <FolderPlus :size="15" />
              <span>{{ t('tree.newFolder') }}</span>
            </div>
            <div class="menu-item" @click="handleCreateRoot('prompt')">
              <FilePlus :size="15" />
              <span>{{ t('tree.newPrompt') }}</span>
            </div>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.tree-view {
  height: 100%;
  overflow-y: auto;
  padding: var(--space-1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-tertiary);
  gap: var(--space-1);
}

.empty-icon {
  color: var(--text-quaternary);
  margin-bottom: var(--space-2);
}

.empty-state p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.hint {
  font-size: var(--font-size-xs) !important;
}

/* ===================
   Context Menu — macOS Native Style
   =================== */
.context-menu {
  position: fixed;
  z-index: var(--z-popover);
  background: var(--bg-popover);
  -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  backdrop-filter: blur(var(--glass-blur-heavy));
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-popover);
  min-width: 180px;
  padding: var(--space-1);
}

@supports not (backdrop-filter: blur(1px)) {
  .context-menu {
    background: var(--bg-elevated);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-xs);
  color: var(--text-primary);
  transition: all var(--duration-instant) ease;
}

.menu-item:hover {
  background-color: var(--color-accent);
  color: var(--text-on-accent);
}

.menu-item.danger {
  color: var(--color-danger);
}

.menu-item.danger:hover {
  background-color: var(--color-danger);
  color: var(--text-on-accent);
}

.menu-divider {
  height: 0.5px;
  background-color: var(--border-secondary);
  margin: var(--space-1) var(--space-2);
}
</style>
