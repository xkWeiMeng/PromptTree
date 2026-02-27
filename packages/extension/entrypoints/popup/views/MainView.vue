<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { extractVariables } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import { useSyncStore } from '@/stores/sync'
import { useClipboard } from '@/composables/useClipboard'
import { useConfirm } from '@/composables/useConfirm'
import { useKeyboard } from '@/composables/useKeyboard'
import TreeView from '../components/TreeView.vue'
import SearchBar from '../components/SearchBar.vue'
import ContextMenu from '../components/ContextMenu.vue'
import NodeEditor from '../components/NodeEditor.vue'
import VariableFillModal from '../components/VariableFillModal.vue'
import SyncStatus from '../components/SyncStatus.vue'
import ViewSwitcher from '../components/ViewSwitcher.vue'
import OutlineView from '../components/OutlineView.vue'
import MindMapView from '../components/MindMapView.vue'

const emit = defineEmits<{
  (e: 'settings'): void
}>()

const treeStore = useTreeStore()
const syncStore = useSyncStore()
const clipboard = useClipboard()
const { confirmDanger } = useConfirm()
const { t } = useI18n()

// 键盘快捷键
useKeyboard({
  onSearch: () => { showSearch.value = true },
  onCreatePrompt: () => { editorDefaultType.value = 'prompt'; editNodeId.value = null; showEditor.value = true },
  onCreateFolder: () => { editorDefaultType.value = 'folder'; editNodeId.value = null; showEditor.value = true },
  onCopyWithVariables: () => {
    const node = treeStore.selectedNode
    if (node?.type === 'prompt') handleCopy(node.content)
  },
})

// ===================
// UI State
// ===================
const showSearch = ref(false)
const showFavoritesOnly = ref(false)
const showEditor = ref(false)
const editNodeId = ref<string | null>(null)
const editorDefaultType = ref<'folder' | 'prompt'>('prompt')

// 右键菜单
const contextMenu = ref({ visible: false, x: 0, y: 0, nodeId: '' })
const contextNode = computed(() => {
  if (!contextMenu.value.nodeId) return null
  return treeStore.getNode(contextMenu.value.nodeId)
})

// 变量填充弹窗
const variableModal = ref({ visible: false, variables: [] as string[], content: '' })

// 选中节点信息
const selectedNode = computed(() => treeStore.selectedNode)

// ===================
// Actions
// ===================

function handleContextMenu(event: MouseEvent, id: string) {
  contextMenu.value = { visible: true, x: event.clientX, y: event.clientY, nodeId: id }
}

async function handleContextAction(action: string) {
  const nodeId = contextMenu.value.nodeId
  const node = treeStore.getNode(nodeId)
  if (!node) return

  switch (action) {
    case 'newFolder':
      editorDefaultType.value = 'folder'
      editNodeId.value = null
      showEditor.value = true
      break
    case 'newPrompt':
      editorDefaultType.value = 'prompt'
      editNodeId.value = null
      showEditor.value = true
      break
    case 'rename':
      treeStore.startEditing(nodeId)
      break
    case 'toggleFavorite':
      await treeStore.toggleFavorite(nodeId)
      break
    case 'inject':
      handleInject(node.content)
      break
    case 'copy':
      await handleCopy(node.content)
      break
    case 'delete': {
      const confirmed = await confirmDanger(
        t('tree.deleteConfirmMsg', { name: node.title }),
        t('tree.deleteConfirmTitle')
      )
      if (confirmed) {
        await treeStore.deleteNode(nodeId)
      }
      break
    }
  }
  syncStore.triggerSync()
}

function handleNewNode() {
  editorDefaultType.value = 'prompt'
  editNodeId.value = null
  showEditor.value = true
}

async function handleInlineRename(id: string, title: string) {
  await treeStore.updateNode(id, { title })
  treeStore.stopEditing()
  syncStore.triggerSync()
}

function handleCancelRename() {
  treeStore.stopEditing()
}

async function handleInject(content: string) {
  const variables = extractVariables(content)
  if (variables.length > 0) {
    variableModal.value = { visible: true, variables, content }
  } else {
    await clipboard.injectContent(content)
  }
}

async function handleCopy(content: string) {
  const variables = await clipboard.copyContent(content)
  if (variables) {
    variableModal.value = { visible: true, variables, content }
  }
}

async function handleVariableInject(filledContent: string) {
  await clipboard.injectContent(filledContent)
}

async function handleVariableCopy(filledContent: string) {
  await clipboard.copy(filledContent)
}

function handleEditorSaved() {
  syncStore.triggerSync()
}

onMounted(async () => {
  await treeStore.init()
  await syncStore.init()
  // 如果已登录，触发同步
  syncStore.triggerSync()
})
</script>

<template>
  <div class="main-view">
    <!-- 编辑器面板（覆盖整个视图） -->
    <NodeEditor
      v-if="showEditor"
      :visible="showEditor"
      :edit-node-id="editNodeId"
      :default-type="editorDefaultType"
      @close="showEditor = false"
      @saved="handleEditorSaved"
    />

    <!-- 主界面 -->
    <template v-else>
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <h1 class="app-title">PromptTree</h1>
        </div>
        <div class="toolbar-right">
          <button
            class="tool-btn"
            :class="{ active: showSearch }"
            :title="$t('tree.searchPlaceholder')"
            @click="showSearch = !showSearch"
          >🔍</button>
          <button
            class="tool-btn"
            :class="{ active: showFavoritesOnly }"
            :title="$t('tree.favorites')"
            @click="showFavoritesOnly = !showFavoritesOnly"
          >⭐</button>
          <button class="tool-btn" :title="$t('tree.newPrompt')" @click="handleNewNode">+</button>
          <SyncStatus />
          <button class="tool-btn" :title="$t('settings.title')" @click="$emit('settings')">⚙</button>
        </div>
      </div>

      <!-- 搜索栏 -->
      <SearchBar v-if="showSearch" @close="showSearch = false" />

      <!-- 视图模式切换 -->
      <ViewSwitcher
        v-if="!showSearch && !showFavoritesOnly"
        v-model="treeStore.viewMode"
      />

      <!-- 收藏列表 -->
      <div v-if="showFavoritesOnly && !showSearch" class="favorites-list">
        <div
          v-for="node in treeStore.favoriteNodes"
          :key="node.id"
          :class="['fav-item', { 'fav-item--selected': selectedNode?.id === node.id }]"
          @click="treeStore.selectNode(node.id)"
        >
          <span>{{ node.type === 'folder' ? '📁' : '📄' }}</span>
          <span class="fav-title">{{ node.title }}</span>
          <span class="fav-star">⭐</span>
        </div>
        <div v-if="treeStore.favoriteNodes.length === 0" class="empty-state">
          <p>{{ $t('tree.noFavorites') }}</p>
        </div>
      </div>

      <!-- 树视图 -->
      <TreeView
        v-if="!showFavoritesOnly && !showSearch && (treeStore.viewMode === 'tree' || treeStore.viewMode === 'drill')"
        :mode="treeStore.viewMode === 'drill' ? 'drill' : 'tree'"
        @contextmenu="handleContextMenu"
        @rename="handleInlineRename"
        @cancel-rename="handleCancelRename"
      />

      <!-- 大纲视图 -->
      <OutlineView
        v-if="!showFavoritesOnly && !showSearch && treeStore.viewMode === 'outline'"
      />

      <!-- 脑图视图 -->
      <MindMapView
        v-if="!showFavoritesOnly && !showSearch && treeStore.viewMode === 'mindmap'"
      />

      <!-- 底部操作栏（选中 Prompt 时） -->
      <div v-if="selectedNode && selectedNode.type === 'prompt'" class="action-bar">
        <button class="action-btn action-btn--primary" @click="handleInject(selectedNode.content)">
          📋 {{ $t('tree.inject') }}
        </button>
        <button class="action-btn" @click="handleCopy(selectedNode.content)">
          📎 {{ $t('tree.copy') }}
        </button>
        <button class="action-btn" @click="editNodeId = selectedNode.id; showEditor = true">
          ✏️ {{ $t('editor.editTitle') }}
        </button>
      </div>
    </template>

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :node-type="contextNode?.type ?? 'prompt'"
      :is-favorite="contextNode?.isFavorite ?? false"
      @close="contextMenu.visible = false"
      @action="handleContextAction"
    />

    <!-- 变量填充弹窗 -->
    <VariableFillModal
      :visible="variableModal.visible"
      :variables="variableModal.variables"
      :content="variableModal.content"
      @close="variableModal.visible = false"
      @inject="handleVariableInject"
      @copy="handleVariableCopy"
    />
  </div>
</template>

<style scoped>
.main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.toolbar-left { display: flex; align-items: center; }
.toolbar-right { display: flex; align-items: center; gap: 4px; }

.app-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary, #4f46e5);
  margin: 0;
}

.tool-btn {
  background: none;
  border: none;
  font-size: 15px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text, #1f2937);
}

.tool-btn:hover,
.tool-btn.active {
  background: var(--color-hover, #f3f4f6);
}

/* Favorites */
.favorites-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.fav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.fav-item:hover { background: var(--color-hover, #f3f4f6); }
.fav-item--selected { background: var(--color-selected, #ede9fe); }

.fav-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-star { font-size: 11px; }

.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: var(--color-text-secondary, #9ca3af);
  font-size: 13px;
}

/* Action Bar */
.action-bar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.action-btn {
  flex: 1;
  padding: 8px 4px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: var(--color-bg, #fff);
  color: var(--color-text, #1f2937);
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--color-hover, #f3f4f6);
}

.action-btn--primary {
  background: var(--color-primary, #4f46e5);
  color: #fff;
  border-color: var(--color-primary, #4f46e5);
}

.action-btn--primary:hover {
  opacity: 0.9;
}
</style>
