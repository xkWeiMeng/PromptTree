<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
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

// Context menu ref for keyboard navigation
const contextMenuRef = ref<HTMLElement | null>(null)

// Focus first menu item when context menu opens
watch(() => contextMenu.value.visible, async (visible) => {
  if (visible) {
    await nextTick()
    const firstItem = contextMenuRef.value?.querySelector('[role="menuitem"]') as HTMLElement | null
    firstItem?.focus()
  }
})

// Keyboard navigation for context menu
function handleMenuKeydown(e: KeyboardEvent) {
  const menu = contextMenuRef.value
  if (!menu) return

  const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[]
  if (items.length === 0) return

  const currentIndex = items.indexOf(document.activeElement as HTMLElement)

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      items[currentIndex < items.length - 1 ? currentIndex + 1 : 0].focus()
      break
    case 'ArrowUp':
      e.preventDefault()
      items[currentIndex > 0 ? currentIndex - 1 : items.length - 1].focus()
      break
    case 'Escape':
      e.preventDefault()
      hideContextMenu()
      break
    case 'Tab':
      e.preventDefault()
      break
  }
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
          ref="contextMenuRef"
          class="context-menu"
          role="menu"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
          @click.stop
          @keydown="handleMenuKeydown"
        >
          <template v-if="contextMenu.node">
            <!-- 节点右键菜单 -->
            <button
              v-if="contextMenu.node.type === 'folder'"
              type="button"
              class="menu-item"
              role="menuitem"
              @click="handleCreateChild('folder')"
            >
              <FolderPlus :size="15" />
              <span>{{ t('tree.newFolder') }}</span>
            </button>
            <button
              v-if="contextMenu.node.type === 'folder'"
              type="button"
              class="menu-item"
              role="menuitem"
              @click="handleCreateChild('prompt')"
            >
              <FilePlus :size="15" />
              <span>{{ t('tree.newPrompt') }}</span>
            </button>
            <div class="menu-divider" v-if="contextMenu.node.type === 'folder'"></div>
            <button type="button" class="menu-item" role="menuitem" @click="handleRename">
              <Pencil :size="15" />
              <span>{{ t('tree.rename') }}</span>
            </button>
            <button type="button" class="menu-item" role="menuitem" @click="handleToggleFavorite">
              <component :is="contextMenu.node.isFavorite ? StarOff : Star" :size="15" />
              <span>{{ contextMenu.node.isFavorite ? t('tree.unfavorite') : t('tree.addFavorite') }}</span>
            </button>
            <button type="button" class="menu-item" role="menuitem" @click="handleShare">
              <Share2 :size="15" />
              <span>{{ t('share.action') }}</span>
            </button>
            <div class="menu-divider"></div>
            <button type="button" class="menu-item danger" role="menuitem" @click="handleDelete">
              <Trash2 :size="15" />
              <span>{{ t('common.delete') }}</span>
            </button>
          </template>
          <template v-else>
            <!-- 空白处右键菜单 -->
            <button type="button" class="menu-item" role="menuitem" @click="handleCreateRoot('folder')">
              <FolderPlus :size="15" />
              <span>{{ t('tree.newFolder') }}</span>
            </button>
            <button type="button" class="menu-item" role="menuitem" @click="handleCreateRoot('prompt')">
              <FilePlus :size="15" />
              <span>{{ t('tree.newPrompt') }}</span>
            </button>
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
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.menu-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-accent);
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
