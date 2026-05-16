<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import OutlineNodeItem from './OutlineNodeItem.vue'
import { List, Search, X, Folder, FileText, Star, ChevronsDownUp, ChevronsUpDown } from 'lucide-vue-next'

const { t } = useI18n()
const treeStore = useTreeStore()

// 大纲搜索过滤
const searchQuery = ref('')

// 每个文件夹的展开状态（大纲独立于树视图）
const outlineExpanded = ref<Set<string>>(new Set())

// 初始化：默认展开第一层
function initExpanded(nodes: TreeNodeWithChildren[]) {
  nodes.forEach(n => {
    if (n.type === 'folder') {
      outlineExpanded.value.add(n.id)
    }
  })
}

// 树形数据
const treeData = computed(() => {
  const data = treeStore.rootNodes
  if (outlineExpanded.value.size === 0 && data.length > 0) {
    initExpanded(data)
  }
  return data
})

// 搜索过滤（递归匹配）
function matchesSearch(node: TreeNodeWithChildren): boolean {
  if (!searchQuery.value) return true
  const q = searchQuery.value.toLowerCase()
  if (node.title.toLowerCase().includes(q)) return true
  if (node.content?.toLowerCase().includes(q)) return true
  return node.children.some(c => matchesSearch(c))
}

const filteredTree = computed(() => {
  if (!searchQuery.value) return treeData.value
  return filterTree(treeData.value)
})

function filterTree(nodes: TreeNodeWithChildren[]): TreeNodeWithChildren[] {
  return nodes
    .filter(n => matchesSearch(n))
    .map(n => ({
      ...n,
      children: filterTree(n.children)
    }))
}

// 节点交互
function toggleOutlineExpand(id: string) {
  if (outlineExpanded.value.has(id)) {
    outlineExpanded.value.delete(id)
  } else {
    outlineExpanded.value.add(id)
  }
}

function handleNodeClick(node: TreeNodeWithChildren) {
  if (node.type === 'prompt') {
    treeStore.selectNode(node.id)
  } else {
    toggleOutlineExpand(node.id)
  }
}

// 统计信息
const stats = computed(() => {
  const active = treeStore.nodes.filter(n => n.deletedAt === null)
  const folders = active.filter(n => n.type === 'folder').length
  const prompts = active.filter(n => n.type === 'prompt').length
  const favorites = active.filter(n => n.isFavorite).length
  return { folders, prompts, favorites }
})

// 全部展开 / 折叠
function expandAllOutline() {
  treeStore.nodes
    .filter(n => n.type === 'folder' && n.deletedAt === null)
    .forEach(n => outlineExpanded.value.add(n.id))
}

function collapseAllOutline() {
  outlineExpanded.value.clear()
}
</script>

<template>
  <div class="outline-view">
    <!-- 头部 -->
    <div class="outline-header">
      <div class="outline-title">
        <List :size="18" class="outline-icon" />
        <h2>{{ t('outline.title') }}</h2>
      </div>
      <div class="outline-stats">
        <span class="stat"><Folder :size="13" /> {{ stats.folders }}</span>
        <span class="stat"><FileText :size="13" /> {{ stats.prompts }}</span>
        <span class="stat"><Star :size="13" /> {{ stats.favorites }}</span>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="outline-toolbar">
      <div class="search-box">
        <Search :size="14" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('outline.searchPlaceholder')"
          class="search-input"
          aria-label="Search outline"
        />
        <button
          v-if="searchQuery"
          class="clear-btn"
          :aria-label="t('outline.clearSearch')"
          @click="searchQuery = ''"
        >
          <X :size="12" />
        </button>
      </div>
      <div class="toolbar-actions">
        <button class="icon-btn" :title="t('tree.expandAll')" :aria-label="t('tree.expandAll')" @click="expandAllOutline">
          <ChevronsDownUp :size="14" />
        </button>
        <button class="icon-btn" :title="t('tree.collapseAll')" :aria-label="t('tree.collapseAll')" @click="collapseAllOutline">
          <ChevronsUpDown :size="14" />
        </button>
      </div>
    </div>

    <!-- 大纲列表 -->
    <div class="outline-list">
      <template v-if="filteredTree.length > 0">
        <OutlineNodeItem
          v-for="node in filteredTree"
          :key="node.id"
          :node="node"
          :level="0"
          :expanded-ids="outlineExpanded"
          :selected-id="treeStore.selectedNodeId"
          :search-query="searchQuery"
          @click="handleNodeClick"
          @toggle="toggleOutlineExpand"
        />
      </template>
      <div v-else class="outline-empty">
        <template v-if="searchQuery">
          <p>{{ t('outline.noMatch') }}</p>
        </template>
        <template v-else>
          <p>{{ t('outline.empty') }}</p>
          <p class="hint">{{ t('outline.emptyHint') }}</p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.outline-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  background: var(--bg-primary);
}

/* ===================
   Header
   =================== */
.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5);
  border-bottom: 0.5px solid var(--border-secondary);
}

.outline-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.outline-title h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.outline-icon {
  color: var(--color-accent);
}

.outline-stats {
  display: flex;
  gap: var(--space-3);
}

.stat {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* ===================
   Toolbar
   =================== */
.outline-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  border-bottom: 0.5px solid var(--border-secondary);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 0 var(--space-2);
}

.search-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  outline: none;
}

.search-input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -1px;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.clear-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: var(--space-1);
  display: flex;
  align-items: center;
  border-radius: var(--radius-xs);
}

.clear-btn:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.toolbar-actions {
  display: flex;
  gap: var(--space-1);
}

/* ===================
   List
   =================== */
.outline-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) 0;
}

.outline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px var(--space-5);
  color: var(--text-tertiary);
  text-align: center;
}

.outline-empty p {
  margin: var(--space-1) 0;
}

.outline-empty .hint {
  font-size: var(--font-size-xs);
  color: var(--text-quaternary);
}
</style>