<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import OutlineNodeItem from './OutlineNodeItem.vue'

const { t } = useI18n()
const treeStore = useTreeStore()

// 大纲搜索
const searchQuery = ref('')

// 展开状态（独立于树视图）
const outlineExpanded = ref<Set<string>>(new Set())

// 初始化：默认展开第一层
function initExpanded(nodes: TreeNodeWithChildren[]) {
  nodes.forEach(n => {
    if (n.type === 'folder') {
      outlineExpanded.value.add(n.id)
    }
  })
}

const treeData = computed(() => {
  const data = treeStore.rootNodes
  if (outlineExpanded.value.size === 0 && data.length > 0) {
    initExpanded(data)
  }
  return data
})

// 搜索过滤
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
    .map(n => ({ ...n, children: filterTree(n.children) }))
}

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

// 统计
const stats = computed(() => {
  const active = treeStore.nodes.filter(n => n.deletedAt === null)
  return {
    folders: active.filter(n => n.type === 'folder').length,
    prompts: active.filter(n => n.type === 'prompt').length,
    favorites: active.filter(n => n.isFavorite).length,
  }
})

function expandAll() {
  treeStore.nodes
    .filter(n => n.type === 'folder' && n.deletedAt === null)
    .forEach(n => outlineExpanded.value.add(n.id))
}

function collapseAll() {
  outlineExpanded.value.clear()
}
</script>

<template>
  <div class="outline-view">
    <div class="outline-header">
      <div class="outline-title">
        <span class="outline-icon">📋</span>
        <h3>{{ t('outline.title') }}</h3>
      </div>
      <div class="outline-stats">
        <span class="stat">📁 {{ stats.folders }}</span>
        <span class="stat">📄 {{ stats.prompts }}</span>
        <span class="stat">⭐ {{ stats.favorites }}</span>
      </div>
    </div>

    <div class="outline-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('outline.searchPlaceholder')"
          class="search-input"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">✕</button>
      </div>
      <div class="toolbar-actions">
        <button class="icon-btn" :title="'Expand all'" @click="expandAll">⬇</button>
        <button class="icon-btn" :title="'Collapse all'" @click="collapseAll">⬆</button>
      </div>
    </div>

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
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.outline-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.outline-title h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #1f2937);
}

.outline-icon {
  font-size: 16px;
}

.outline-stats {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--color-text-secondary, #9ca3af);
}

.outline-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--color-hover, #f3f4f6);
  border-radius: 6px;
  padding: 0 6px;
}

.search-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 5px 6px;
  font-size: 12px;
  color: var(--color-text, #1f2937);
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-secondary, #9ca3af);
}

.clear-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-secondary, #9ca3af);
  padding: 2px;
  font-size: 11px;
  border-radius: 3px;
}

.clear-btn:hover {
  background: var(--color-border, #e5e7eb);
}

.toolbar-actions {
  display: flex;
  gap: 2px;
}

.icon-btn {
  background: none;
  border: none;
  padding: 3px 5px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-secondary, #9ca3af);
}

.icon-btn:hover {
  background: var(--color-hover, #f3f4f6);
}

.outline-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.outline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: var(--color-text-secondary, #9ca3af);
  text-align: center;
  font-size: 13px;
}

.outline-empty p {
  margin: 2px 0;
}

.outline-empty .hint {
  font-size: 11px;
  color: var(--color-text-secondary, #9ca3af);
  opacity: 0.7;
}
</style>
