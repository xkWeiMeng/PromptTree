<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { extractVariables } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import { useSync, useKeyboard, useHead, useToast, useUndoRedo } from '@/composables'
import { Folder, List, Network, FileText } from 'lucide-vue-next'
import MainLayout from '@/components/layout/MainLayout.vue'
import TreeView from '@/components/tree/TreeView.vue'
import TreeToolbar from '@/components/tree/TreeToolbar.vue'
import PromptEditor from '@/components/editor/PromptEditor.vue'
import VariableFillModal from '@/components/editor/VariableFillModal.vue'
import ViewSwitcher from '@/components/overview/ViewSwitcher.vue'
import OutlineView from '@/components/overview/OutlineView.vue'
import MindMapView from '@/components/overview/MindMapView.vue'
import ShareModal from '@/components/common/ShareModal.vue'
import ShortcutsPanel from '@/components/common/ShortcutsPanel.vue'
import OnboardingTip from '@/components/common/OnboardingTip.vue'
import ExportImportModal from '@/components/common/ExportImportModal.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const treeStore = useTreeStore()

// 启用同步
useSync()

// Undo/Redo
const { undo } = useUndoRedo()

// Shortcuts panel ref
const shortcutsPanelRef = ref<InstanceType<typeof ShortcutsPanel> | null>(null)

// Find/Replace event forwarding
const promptEditorRef = ref<InstanceType<typeof PromptEditor> | null>(null)

// 处理邮箱验证成功的提示
const errorMessages: Record<string, string> = {
  invalid_or_expired_token: 'login.linkExpired',
  no_token: 'login.linkInvalid',
  user_not_found: 'login.userNotFound',
  link_already_used: 'login.linkAlreadyUsed',
}

onMounted(() => {
  if (route.query.verified === '1') {
    toast.success(t('login.emailVerifiedSuccess'), 5000)
  } else if (route.query.error) {
    const key = errorMessages[route.query.error as string] || 'login.linkExpired'
    toast.error(t(key), 6000)
  }
  // 清除 URL 中的查询参数
  if (route.query.verified || route.query.error) {
    router.replace({ path: '/app' })
  }
})

// 当前选中的节点
const selectedNode = computed(() => {
  if (!treeStore.selectedNodeId) return null
  return treeStore.nodes.find(n => n.id === treeStore.selectedNodeId)
})

// SEO: 动态页面标题（跟随选中节点变化）
const pageTitle = computed(() => {
  if (selectedNode.value) {
    return `${selectedNode.value.title || t('common.untitled')} - ${t('app.workspace')}`
  }
  return t('app.workspace')
})
useHead({
  title: pageTitle,
  robots: 'noindex, nofollow'
})

// 是否显示编辑器（只有选中 prompt 类型 + editor 模式时显示）
const showEditor = computed(() =>
  treeStore.viewMode === 'editor' && selectedNode.value?.type === 'prompt'
)

// 是否显示视图切换栏（非欢迎页时显示）
const showViewSwitcher = computed(() => treeStore.viewMode !== 'welcome')

// 变量填充弹窗
const showVariableModal = ref(false)
const showShareModal = ref(false)
const showExportImportModal = ref(false)
const shareTargetNodeId = ref<string | null>(null)
const currentVariables = computed(() => {
  if (!selectedNode.value?.content) return []
  return extractVariables(selectedNode.value.content)
})
const currentContent = computed(() => selectedNode.value?.content || '')

// 创建节点
async function handleCreate(type: 'folder' | 'prompt', parentId: string | null = null) {
  const title = type === 'folder' ? t('tree.newFolder') : t('tree.newPrompt')
  const newNode = await treeStore.createNode({
    type,
    title,
    parentId,
    content: ''
  })
  // 新建文件夹后自动进入重命名编辑状态
  if (type === 'folder') {
    treeStore.startEditing(newNode.id)
  }
}

// 从工具栏创建（在根目录或选中的文件夹下创建）
function handleToolbarCreate(type: 'folder' | 'prompt') {
  const parentId = selectedNode.value?.type === 'folder' 
    ? selectedNode.value.id 
    : selectedNode.value?.parentId || null
  handleCreate(type, parentId)
}

// 显示变量弹窗
function handleShowVariables() {
  showVariableModal.value = true
}

function handleShare(nodeId: string) {
  shareTargetNodeId.value = nodeId
  showShareModal.value = true
}

function closeShareModal() {
  showShareModal.value = false
  shareTargetNodeId.value = null
}

// 欢迎页快捷入口
function goToOutline() {
  treeStore.setViewMode('outline')
}

function goToMindmap() {
  treeStore.setViewMode('mindmap')
}

// 树工具栏 ref（用于搜索聚焦）
const treeToolbarRef = ref<InstanceType<typeof TreeToolbar> | null>(null)

// 启用键盘快捷键
useKeyboard({
  onCreatePrompt: () => handleToolbarCreate('prompt'),
  onCreateFolder: () => handleToolbarCreate('folder'),
  onSearch: () => treeToolbarRef.value?.focusSearch(),
  onUndo: () => undo(),
  onShowShortcuts: () => shortcutsPanelRef.value?.open(),
  onFindReplace: () => promptEditorRef.value?.toggleFindReplace?.(),
  onCopyWithVariables: () => {
    if (selectedNode.value?.type === 'prompt' && currentVariables.value.length > 0) {
      showVariableModal.value = true
    }
  }
})
</script>

<template>
  <MainLayout>
    <!-- 侧边栏：工具栏 + 树视图 -->
    <template #sidebar>
      <TreeToolbar ref="treeToolbarRef" @create="handleToolbarCreate" @export-import="showExportImportModal = true" />
      <TreeView @create="handleCreate" @share="handleShare" />
    </template>
    
    <!-- 主内容：视图切换 -->
    <template #content>
      <div class="content-wrapper">
        <!-- 骨架加载状态 -->
        <div v-if="treeStore.isLoading" class="skeleton-wrapper" :aria-label="t('common.loading')">
          <div class="skeleton-header">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-actions">
              <div class="skeleton-circle"></div>
              <div class="skeleton-circle"></div>
              <div class="skeleton-circle"></div>
            </div>
          </div>
          <div class="skeleton-cards">
            <div v-for="i in 4" :key="i" class="skeleton-card">
              <div class="skeleton-line skeleton-card-title"></div>
              <div class="skeleton-line skeleton-card-body"></div>
              <div class="skeleton-line skeleton-card-body short"></div>
            </div>
          </div>
        </div>

        <template v-else>
        <!-- 视图切换栏 -->
        <ViewSwitcher v-if="showViewSwitcher" />

        <Transition name="view-fade" mode="out-in">
        <!-- 编辑器视图 -->
        <PromptEditor
          v-if="showEditor && treeStore.selectedNodeId"
          ref="promptEditorRef"
          :key="'editor-' + treeStore.selectedNodeId"
          :node-id="treeStore.selectedNodeId"
          @show-variables="handleShowVariables"
          @share="handleShare"
        />

        <!-- 大纲视图 -->
        <OutlineView v-else-if="treeStore.viewMode === 'outline'" key="outline" />

        <!-- 思维导图视图 -->
        <MindMapView v-else-if="treeStore.viewMode === 'mindmap'" key="mindmap" />
      
        <!-- 选中文件夹时的提示（仅在 welcome 模式） -->
        <section v-else-if="selectedNode?.type === 'folder' && treeStore.viewMode === 'welcome'" key="folder-detail" class="folder-selected" :aria-label="t('app.folderDetailAriaLabel')">
          <Folder :size="48" class="state-icon folder" aria-hidden="true" />
          <h2>{{ selectedNode.title || t('common.untitledFolder') }}</h2>
          <p class="hint">{{ t('app.folderHint') }}</p>
          <nav class="view-entries" :aria-label="t('app.quickActionsAriaLabel')">
            <button class="entry-btn" @click="goToOutline" :aria-label="t('app.outlineAriaLabel')">
              <List :size="20" class="entry-icon" aria-hidden="true" />
              <span>{{ t('app.browseOutline') }}</span>
            </button>
            <button class="entry-btn" @click="goToMindmap" :aria-label="t('app.mindmapAriaLabel')">
              <Network :size="20" class="entry-icon" aria-hidden="true" />
              <span>{{ t('app.mindmap') }}</span>
            </button>
          </nav>
        </section>
      
        <!-- 欢迎页 -->
        <section v-else key="welcome" class="empty-state" :aria-label="t('app.welcomeAriaLabel')">
          <FileText :size="48" class="state-icon" aria-hidden="true" />
          <h2>{{ t('app.welcomeTitle') }}</h2>
          <p>{{ t('app.welcomeDesc') }}</p>

          <!-- 快捷入口 -->
          <nav class="view-entries" :aria-label="t('app.quickEntryAriaLabel')">
            <button class="entry-btn entry-outline" @click="goToOutline" :aria-label="t('app.outlineAriaLabel')">
              <List :size="24" class="entry-icon" aria-hidden="true" />
              <div class="entry-text">
                <span class="entry-title">{{ t('app.browseOutline') }}</span>
                <span class="entry-desc">{{ t('app.outlineDesc') }}</span>
              </div>
            </button>
            <button class="entry-btn entry-mindmap" @click="goToMindmap" :aria-label="t('app.mindmapAriaLabel')">
              <Network :size="24" class="entry-icon" aria-hidden="true" />
              <div class="entry-text">
                <span class="entry-title">{{ t('app.mindmap') }}</span>
                <span class="entry-desc">{{ t('app.mindmapDesc') }}</span>
              </div>
            </button>
          </nav>

          <aside class="shortcuts" :aria-label="t('app.shortcutsAriaLabel')">
            <p class="shortcut-title">{{ t('app.shortcutsTitle') }}</p>
            <ul>
              <li><kbd>Ctrl</kbd> + <kbd>N</kbd> {{ t('app.shortcutNewPrompt') }}</li>
              <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd> {{ t('app.shortcutNewFolder') }}</li>
              <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> {{ t('app.shortcutOpenOutline') }}</li>
              <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd> {{ t('app.shortcutOpenMindmap') }}</li>
              <li><kbd>Esc</kbd> {{ t('app.shortcutCloseEditor') }}</li>
              <li><kbd>Delete</kbd> {{ t('app.shortcutDelete') }}</li>
            </ul>
          </aside>
        </section>
        </Transition>
        </template>
      </div>
    </template>
  </MainLayout>
  
  <!-- 变量填充弹窗 -->
  <VariableFillModal
    :visible="showVariableModal"
    :variables="currentVariables"
    :content="currentContent"
    @close="showVariableModal = false"
    @copy="showVariableModal = false"
  />

  <ShareModal
    :visible="showShareModal"
    :node-id="shareTargetNodeId"
    @close="closeShareModal"
  />

  <ShortcutsPanel ref="shortcutsPanelRef" />

  <OnboardingTip />

  <ExportImportModal
    :visible="showExportImportModal"
    @close="showExportImportModal = false"
  />
</template>

<style scoped>
.content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.folder-selected,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-secondary);
  text-align: center;
  padding: var(--space-8);
}

.state-icon {
  color: var(--text-quaternary);
  margin-bottom: var(--space-4);
}

.state-icon.folder {
  color: var(--color-accent);
}

h2 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing-tight);
}

.hint {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

/* ===================
   Quick Entries
   =================== */
.view-entries {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.entry-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  min-height: var(--touch-target-min);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-xl);
  background: var(--bg-elevated);
  cursor: pointer;
  transition: transform var(--duration-normal) var(--ease-out),
    background-color var(--duration-normal) var(--ease-out),
    border-color var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
  text-align: left;
}

.entry-btn:hover {
  border-color: var(--color-accent);
  background: var(--accent-bg-subtle);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.entry-btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-ring);
  border-color: var(--color-accent);
}

.entry-btn:active {
  transform: scale(0.98);
  box-shadow: none;
}

.entry-icon {
  color: var(--color-accent);
  flex-shrink: 0;
}

.entry-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entry-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.entry-desc {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* ===================
   Shortcuts
   =================== */
.shortcuts {
  margin-top: var(--space-8);
  text-align: left;
  background: var(--bg-secondary);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
}

.shortcut-title {
  margin: 0 0 var(--space-2) 0;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.shortcuts ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.shortcuts li {
  margin: var(--space-2) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* ===================
   Skeleton Loading
   =================== */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: var(--space-6) var(--space-8);
  gap: var(--space-6);
}

.skeleton-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skeleton-line {
  background: var(--bg-quaternary);
  border-radius: var(--radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-title {
  height: 24px;
  width: 200px;
}

.skeleton-actions {
  display: flex;
  gap: var(--space-2);
}

.skeleton-circle {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--bg-quaternary);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.skeleton-card {
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.skeleton-card-title {
  height: 16px;
  width: 40%;
}

.skeleton-card-body {
  height: 12px;
  width: 90%;
}

.skeleton-card-body.short {
  width: 60%;
}

/* ===================
   Mobile
   =================== */
@media (max-width: 640px) {
  .folder-selected,
  .empty-state {
    padding: var(--space-4);
  }

  .view-entries {
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
  }

  .entry-btn {
    width: 100%;
  }

  .shortcuts {
    margin-top: var(--space-5);
    padding: var(--space-3) var(--space-4);
  }
}
</style>
