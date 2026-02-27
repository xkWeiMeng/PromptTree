<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { extractVariables } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'

const { t } = useI18n()
const treeStore = useTreeStore()

// 当前渲染的根节点
const rootData = computed<TreeNodeWithChildren>(() => {
  const rootId = treeStore.mindmapRootId

  if (!rootId) {
    return {
      id: '__root__',
      parentId: null,
      type: 'folder' as const,
      title: 'PromptTree',
      content: '',
      isFavorite: false,
      sortOrder: 0,
      collapsed: false,
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
      version: 0,
      children: treeStore.rootNodes,
    }
  }

  function findNode(nodes: TreeNodeWithChildren[], id: string): TreeNodeWithChildren | null {
    for (const n of nodes) {
      if (n.id === id) return n
      const found = findNode(n.children, id)
      if (found) return found
    }
    return null
  }

  return findNode(treeStore.rootNodes, rootId) || {
    id: '__root__',
    parentId: null,
    type: 'folder' as const,
    title: 'PromptTree',
    content: '',
    isFavorite: false,
    sortOrder: 0,
    collapsed: false,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    version: 0,
    children: treeStore.rootNodes,
  }
})

const folderOptions = computed(() => {
  return treeStore.nodes
    .filter(n => n.type === 'folder' && n.deletedAt === null)
    .map(n => ({ id: n.id, title: n.title || t('common.untitledFolder') }))
})

function handleNodeClick(node: TreeNodeWithChildren) {
  if (node.id === '__root__') return
  if (node.type === 'folder') {
    treeStore.setMindmapRoot(node.id)
  } else {
    treeStore.selectNode(node.id)
  }
}

function goUpLevel() {
  if (!treeStore.mindmapRootId) return
  const current = treeStore.nodes.find(n => n.id === treeStore.mindmapRootId)
  treeStore.setMindmapRoot(current?.parentId ?? null)
}

function handleRootChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value
  treeStore.setMindmapRoot(val || null)
}

function truncate(text: string, max = 20): string {
  if (!text) return t('common.untitled')
  return text.length > max ? text.slice(0, max) + '...' : text
}

function getVarCount(content: string): number {
  return content ? extractVariables(content).length : 0
}
</script>

<template>
  <div class="mindmap-view">
    <!-- 工具栏 -->
    <div class="mindmap-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-icon">🧠</span>
        <h3>{{ t('mindmapView.title') }}</h3>

        <button
          v-if="treeStore.mindmapRootId"
          class="up-btn"
          :title="t('mindmapView.goUpLevel')"
          @click="goUpLevel"
        >⬆</button>

        <select
          class="scope-select"
          :value="treeStore.mindmapRootId || ''"
          @change="handleRootChange"
        >
          <option value="">{{ t('mindmapView.all') }}</option>
          <option
            v-for="f in folderOptions"
            :key="f.id"
            :value="f.id"
          >{{ f.title }}</option>
        </select>
      </div>
    </div>

    <!-- 可视化树 -->
    <div class="mindmap-canvas">
      <div class="tree-root">
        <div
          class="tree-node tree-node--root"
          @click="handleNodeClick(rootData)"
        >
          <span class="node-icon">🌲</span>
          <span class="node-label">{{ truncate(rootData.title) }}</span>
        </div>

        <div v-if="rootData.children.length > 0" class="tree-branch">
          <div
            v-for="child in rootData.children"
            :key="child.id"
            class="tree-child"
          >
            <div class="tree-connector" />
            <div
              class="tree-node"
              :class="{
                'tree-node--folder': child.type === 'folder',
                'tree-node--prompt': child.type === 'prompt',
                'tree-node--selected': child.id === treeStore.selectedNodeId,
                'tree-node--favorite': child.isFavorite,
              }"
              @click="handleNodeClick(child)"
            >
              <span class="node-icon">{{ child.type === 'folder' ? '📁' : '📄' }}</span>
              <span class="node-label">{{ truncate(child.title) }}</span>
              <span v-if="child.isFavorite" class="node-star">⭐</span>
              <span v-if="child.type === 'folder' && child.children.length" class="node-count">
                {{ child.children.length }}
              </span>
              <span v-if="child.type === 'prompt' && getVarCount(child.content) > 0" class="node-vars">
                {{ getVarCount(child.content) }}
              </span>
            </div>

            <!-- 第二层 -->
            <div v-if="child.type === 'folder' && child.children.length > 0" class="tree-sub-branch">
              <div
                v-for="grandchild in child.children.slice(0, 5)"
                :key="grandchild.id"
                class="tree-sub-child"
              >
                <div class="tree-sub-connector" />
                <div
                  class="tree-node tree-node--small"
                  :class="{
                    'tree-node--folder': grandchild.type === 'folder',
                    'tree-node--prompt': grandchild.type === 'prompt',
                    'tree-node--selected': grandchild.id === treeStore.selectedNodeId,
                  }"
                  @click="handleNodeClick(grandchild)"
                >
                  <span class="node-icon">{{ grandchild.type === 'folder' ? '📁' : '📄' }}</span>
                  <span class="node-label">{{ truncate(grandchild.title, 14) }}</span>
                </div>
              </div>
              <div v-if="child.children.length > 5" class="tree-more">
                +{{ child.children.length - 5 }} {{ t('mindmapView.more') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mindmap-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mindmap-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-icon {
  font-size: 16px;
}

.mindmap-toolbar h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #1f2937);
}

.up-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
  border-radius: 4px;
}

.up-btn:hover {
  background: var(--color-hover, #f3f4f6);
}

.scope-select {
  padding: 3px 6px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 11px;
  color: var(--color-text, #1f2937);
  background: var(--color-bg, #fff);
  cursor: pointer;
  outline: none;
  max-width: 140px;
}

.scope-select:focus {
  border-color: var(--color-primary, #4f46e5);
}

/* Canvas */
.mindmap-canvas {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.tree-root {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
  white-space: nowrap;
}

.tree-node--root {
  background: var(--color-primary, #4f46e5);
  color: #fff;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  margin-bottom: 8px;
}

.tree-node--folder {
  background: #5856D6;
  color: #fff;
}

.tree-node--prompt {
  background: #34C759;
  color: #fff;
}

.tree-node--selected {
  box-shadow: 0 0 0 2px #FF9500;
}

.tree-node--favorite .node-star {
  font-size: 10px;
}

.tree-node:hover {
  filter: brightness(1.1);
}

.tree-node--small {
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 6px;
}

.node-icon {
  font-size: 12px;
}

.node-label {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-count {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 2px;
}

.node-vars {
  font-size: 9px;
  background: rgba(255,255,255,0.3);
  padding: 0 4px;
  border-radius: 3px;
  margin-left: 2px;
}

/* Tree branches */
.tree-branch {
  margin-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.tree-child {
  display: flex;
  flex-direction: column;
  position: relative;
}

.tree-connector {
  position: absolute;
  left: -16px;
  top: 14px;
  width: 12px;
  height: 2px;
  background: var(--color-border, #e5e7eb);
}

.tree-child::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 0;
  bottom: 50%;
  width: 2px;
  background: var(--color-border, #e5e7eb);
}

.tree-sub-branch {
  margin-left: 28px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  position: relative;
}

.tree-sub-child {
  position: relative;
}

.tree-sub-connector {
  position: absolute;
  left: -14px;
  top: 10px;
  width: 10px;
  height: 2px;
  background: var(--color-border, #e5e7eb);
}

.tree-more {
  font-size: 10px;
  color: var(--color-text-secondary, #9ca3af);
  margin-left: 4px;
  margin-top: 2px;
  cursor: default;
}
</style>
