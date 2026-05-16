<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { hierarchy, tree as d3Tree } from 'd3-hierarchy'
import { select } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import type { HierarchyPointNode } from 'd3-hierarchy'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { extractVariables } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import { useI18n } from 'vue-i18n'
import { Network, ArrowUp, ZoomIn, ZoomOut, RotateCcw, Folder, FileText, TreePine } from 'lucide-vue-next'

const { t } = useI18n()
const treeStore = useTreeStore()

// ===================
// State
// ===================
const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const tooltip = ref<{ visible: boolean; x: number; y: number; node: TreeNodeWithChildren | null }>({
  visible: false, x: 0, y: 0, node: null
})

// 布局后的节点与连线
const layoutNodes = ref<HierarchyPointNode<TreeNodeWithChildren>[]>([])
const layoutLinks = ref<{ source: HierarchyPointNode<TreeNodeWithChildren>; target: HierarchyPointNode<TreeNodeWithChildren> }[]>([])

// 画布变换
const transform = ref({ x: 0, y: 0, k: 1 })

// SVG 尺寸
const svgWidth = ref(800)
const svgHeight = ref(600)

// ===================
// Computed
// ===================

/** 可用的文件夹列表（用于范围选择） */
const folderOptions = computed(() => {
  return treeStore.nodes
    .filter(n => n.type === 'folder' && n.deletedAt === null)
    .map(n => ({ id: n.id, title: n.title || t('common.untitledFolder') }))
})

/** 根据 mindmapRootId 获取树形数据 */
const rootData = computed<TreeNodeWithChildren>(() => {
  const rootId = treeStore.mindmapRootId

  if (!rootId) {
    // 全局：创建虚拟根节点
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
      children: treeStore.rootNodes
    }
  }

  // 特定子树
  function findNode(nodes: TreeNodeWithChildren[], id: string): TreeNodeWithChildren | null {
    for (const n of nodes) {
      if (n.id === id) return n
      const found = findNode(n.children, id)
      if (found) return found
    }
    return null
  }

  const found = findNode(treeStore.rootNodes, rootId)
  if (found) return found

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
    children: treeStore.rootNodes
  }
})

// ===================
// Layout
// ===================

/** 节点尺寸常量 */
const NODE_WIDTH = 180
const NODE_HEIGHT = 60
const NODE_H_SPACING = 220
const NODE_V_SPACING = 80

function computeLayout() {
  const root = hierarchy(rootData.value)
  const treeLayout = d3Tree<TreeNodeWithChildren>()
    .nodeSize([NODE_V_SPACING, NODE_H_SPACING])

  treeLayout(root)

  layoutNodes.value = root.descendants()
  layoutLinks.value = root.links() as typeof layoutLinks.value
}

/** 生成水平树连线路径 (source.y → target.y 为水平方向) */
function linkPath(d: { source: HierarchyPointNode<TreeNodeWithChildren>; target: HierarchyPointNode<TreeNodeWithChildren> }): string {
  const sx = d.source.y
  const sy = d.source.x
  const tx = d.target.y
  const ty = d.target.x
  const mx = (sx + tx) / 2
  return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`
}

// ===================
// Zoom & Pan
// ===================

let zoomBehavior: ReturnType<typeof zoom> | null = null

function initZoom() {
  if (!svgRef.value) return

  zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 3])
    .on('zoom', (event) => {
      transform.value = {
        x: event.transform.x,
        y: event.transform.y,
        k: event.transform.k
      }
    })

  select(svgRef.value).call(zoomBehavior)
}

function resetZoom() {
  if (!svgRef.value || !zoomBehavior) return

  // Fit to center
  const centerX = svgWidth.value / 2
  const centerY = svgHeight.value / 2

  select(svgRef.value)
    .transition()
    .duration(500)
    .call(
      zoomBehavior.transform,
      zoomIdentity.translate(centerX, centerY).scale(0.8)
    )
}

function zoomIn() {
  if (!svgRef.value || !zoomBehavior) return
  select(svgRef.value).transition().duration(300).call(zoomBehavior.scaleBy, 1.3)
}

function zoomOut() {
  if (!svgRef.value || !zoomBehavior) return
  select(svgRef.value).transition().duration(300).call(zoomBehavior.scaleBy, 0.7)
}

// ===================
// Interaction
// ===================

function handleNodeClick(node: HierarchyPointNode<TreeNodeWithChildren>) {
  if (node.data.id === '__root__') return

  if (node.data.type === 'prompt') {
    treeStore.selectNode(node.data.id)
  } else {
    // 文件夹：下钻
    treeStore.setMindmapRoot(node.data.id)
  }
}

function handleNodeHover(event: MouseEvent, node: HierarchyPointNode<TreeNodeWithChildren>) {
  if (node.data.id === '__root__') return
  tooltip.value = {
    visible: true,
    x: event.clientX + 12,
    y: event.clientY + 12,
    node: node.data
  }
}

function handleNodeLeave() {
  tooltip.value.visible = false
}

function getTooltipVars(content: string): string[] {
  return content ? extractVariables(content) : []
}

function handleRootChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value
  treeStore.setMindmapRoot(val || null)
}

function goUpLevel() {
  if (!treeStore.mindmapRootId) return
  const current = treeStore.nodes.find(n => n.id === treeStore.mindmapRootId)
  treeStore.setMindmapRoot(current?.parentId ?? null)
}

// ===================
// Lifecycle
// ===================

function updateSize() {
  if (containerRef.value) {
    svgWidth.value = containerRef.value.clientWidth
    svgHeight.value = containerRef.value.clientHeight
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateSize()
  computeLayout()
  nextTick(() => {
    initZoom()
    resetZoom()
  })

  resizeObserver = new ResizeObserver(() => {
    updateSize()
  })
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// 响应数据变化重新布局
watch([rootData], () => {
  computeLayout()
  nextTick(() => resetZoom())
}, { deep: true })

// ===================
// Node rendering helpers
// ===================

function getNodeFill(node: HierarchyPointNode<TreeNodeWithChildren>): string {
  if (node.data.id === '__root__') return '#007AFF'
  return node.data.type === 'folder' ? '#5856D6' : '#34C759'
}

function getNodeStroke(node: HierarchyPointNode<TreeNodeWithChildren>): string {
  if (node.data.id === treeStore.selectedNodeId) return '#FF9500'
  if (node.data.id === '__root__') return '#0051A8'
  return node.data.type === 'folder' ? '#3634A3' : '#248A3D'
}

function getNodeIcon(node: HierarchyPointNode<TreeNodeWithChildren>): string {
  if (node.data.id === '__root__') return '🌲'
  return node.data.type === 'folder' ? '📁' : '📄'
}

function truncateTitle(title: string, max = 16): string {
  if (!title) return t('common.untitled')
  return title.length > max ? title.slice(0, max) + '...' : title
}
</script>

<template>
  <div class="mindmap-view" ref="containerRef">
    <!-- 工具栏 -->
    <div class="mindmap-toolbar">
      <div class="toolbar-left">
        <Network :size="18" class="toolbar-icon" />
        <h2>{{ t('mindmapView.title') }}</h2>

        <!-- 范围选择 -->
        <div class="scope-selector">
          <button
            v-if="treeStore.mindmapRootId"
            class="icon-btn"
            :title="t('mindmapView.goUpLevel')"
            :aria-label="t('mindmapView.goUpLevel')"
            @click="goUpLevel"
          ><ArrowUp :size="14" /></button>
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

      <div class="toolbar-right">
        <button class="icon-btn zoom-btn" :title="t('mindmapView.zoomIn')" aria-label="Zoom in" @click="zoomIn"><ZoomIn :size="16" /></button>
        <button class="icon-btn zoom-btn" :title="t('mindmapView.zoomOut')" aria-label="Zoom out" @click="zoomOut"><ZoomOut :size="16" /></button>
        <button class="icon-btn zoom-btn" :title="t('mindmapView.resetView')" aria-label="Reset zoom" @click="resetZoom"><RotateCcw :size="16" /></button>
      </div>
    </div>

    <!-- SVG 画布 -->
    <svg
      ref="svgRef"
      class="mindmap-svg"
      :width="svgWidth"
      :height="svgHeight"
      style="touch-action: none"
    >
      <g :transform="`translate(${transform.x},${transform.y}) scale(${transform.k})`">
        <!-- 连线 -->
        <path
          v-for="(link, idx) in layoutLinks"
          :key="'link-' + idx"
          :d="linkPath(link)"
          class="mindmap-link"
          :class="{ 'link-to-folder': link.target.data.type === 'folder' }"
        />

        <!-- 节点 -->
        <g
          v-for="node in layoutNodes"
          :key="'node-' + node.data.id"
          class="mindmap-node"
          :class="{
            'node-root': node.data.id === '__root__',
            'node-folder': node.data.type === 'folder' && node.data.id !== '__root__',
            'node-prompt': node.data.type === 'prompt',
            'node-selected': node.data.id === treeStore.selectedNodeId
          }"
          :transform="`translate(${node.y},${node.x})`"
          tabindex="0"
          role="button"
          :aria-label="node.data.title || t('common.untitled')"
          @click.stop="handleNodeClick(node)"
          @keydown.enter="handleNodeClick(node)"
          @mouseenter="(e: MouseEvent) => handleNodeHover(e, node)"
          @mouseleave="handleNodeLeave"
        >
          <!-- 节点背景 -->
          <rect
            :x="-NODE_WIDTH / 2"
            :y="-NODE_HEIGHT / 2"
            :width="NODE_WIDTH"
            :height="NODE_HEIGHT"
            :rx="node.data.id === '__root__' ? 30 : 8"
            :ry="node.data.id === '__root__' ? 30 : 8"
            :fill="getNodeFill(node)"
            :stroke="getNodeStroke(node)"
            :stroke-width="node.data.id === treeStore.selectedNodeId ? 3 : 1.5"
            class="node-rect"
          />

          <!-- 图标 -->
          <text
            :x="-NODE_WIDTH / 2 + 14"
            y="5"
            font-size="16"
            text-anchor="start"
          >{{ getNodeIcon(node) }}</text>

          <!-- 标题 -->
          <text
            :x="-NODE_WIDTH / 2 + 36"
            y="1"
            font-size="13"
            font-weight="500"
            fill="white"
            text-anchor="start"
            dominant-baseline="middle"
          >{{ truncateTitle(node.data.title) }}</text>

          <!-- 子节点计数（文件夹） -->
          <text
            v-if="node.data.type === 'folder' && node.children"
            :x="NODE_WIDTH / 2 - 12"
            y="1"
            font-size="11"
            fill="rgba(255,255,255,0.7)"
            text-anchor="end"
            dominant-baseline="middle"
          >{{ node.children.length }}</text>

          <!-- 收藏标记 -->
          <text
            v-if="node.data.isFavorite"
            :x="NODE_WIDTH / 2 - 12"
            :y="-NODE_HEIGHT / 2 + 14"
            font-size="12"
          >⭐</text>
        </g>
      </g>
    </svg>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible && tooltip.node"
        class="mindmap-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="tooltip-title">
          <Folder v-if="tooltip.node.type === 'folder'" :size="14" />
          <FileText v-else :size="14" />
          {{ tooltip.node.title || t('common.untitled') }}
        </div>
        <div v-if="tooltip.node.content" class="tooltip-content">
          {{ tooltip.node.content.slice(0, 120) }}{{ tooltip.node.content.length > 120 ? '...' : '' }}
        </div>
        <div v-if="getTooltipVars(tooltip.node.content).length > 0" class="tooltip-vars">
          {{ t('mindmapView.variables') }} {{ getTooltipVars(tooltip.node.content).join(', ') }}
        </div>
        <div class="tooltip-hint">
          {{ tooltip.node.type === 'folder' ? t('mindmapView.clickToDrill') : t('mindmapView.clickToEdit') }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.mindmap-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  position: relative;
}

/* ===================
   Toolbar
   =================== */
.mindmap-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5);
  border-bottom: 0.5px solid var(--border-secondary);
  z-index: 10;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.toolbar-icon {
  color: var(--color-accent);
}

.toolbar-left h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.scope-selector {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: var(--space-2);
}

.scope-select {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  background: var(--bg-input);
  cursor: pointer;
  outline: none;
  transition: border-color var(--duration-fast) ease,
              box-shadow var(--duration-fast) ease;
}

.scope-select:focus {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.toolbar-right {
  display: flex;
  gap: var(--space-1);
}

/* ===================
   SVG Canvas
   =================== */
.mindmap-svg {
  flex: 1;
  display: block;
  cursor: grab;
}

.mindmap-svg:active {
  cursor: grabbing;
}

.mindmap-link {
  fill: none;
  stroke: var(--border-secondary);
  stroke-width: 2;
  opacity: 0.6;
}

.mindmap-link.link-to-folder {
  stroke: var(--color-accent);
  opacity: 0.3;
}

.mindmap-node {
  cursor: pointer;
}

.mindmap-node .node-rect {
  transition: filter var(--duration-fast) ease;
}

.mindmap-node:hover .node-rect {
  filter: brightness(1.1);
}

.mindmap-node.node-selected .node-rect {
  filter: drop-shadow(0 0 6px rgba(255, 149, 0, 0.5));
}

.mindmap-node.node-root {
  cursor: default;
}

/* ===================
   Tooltip (glassmorphism)
   =================== */
.mindmap-tooltip {
  position: fixed;
  z-index: var(--z-tooltip);
  max-width: 280px;
  background: var(--bg-elevated);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-popover);
  pointer-events: none;
  font-size: var(--font-size-xs);
}

@supports (backdrop-filter: blur(1px)) {
  .mindmap-tooltip {
    background: var(--glass-bg-thick);
    backdrop-filter: blur(var(--glass-blur-heavy));
    -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  }
}

.tooltip-title {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.tooltip-title svg {
  color: var(--color-accent);
}

.tooltip-content {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-1);
  word-break: break-all;
}

.tooltip-vars {
  color: var(--color-accent);
  font-size: 11px;
  margin-bottom: var(--space-1);
  font-weight: var(--font-weight-medium);
}

.tooltip-hint {
  color: var(--text-tertiary);
  font-size: 11px;
  font-style: italic;
}

/* ===================
   Mobile
   =================== */
@media (max-width: 640px) {
  .zoom-btn {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
