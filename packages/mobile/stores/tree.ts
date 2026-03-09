import { create } from 'zustand'
import type { TreeNode, TreeNodeWithChildren } from '@prompttree/shared'
import { buildTree, getDescendantIds, createDefaultNode, getBreadcrumb } from '@prompttree/shared'
import * as dbOps from '../db/operations'
import { scheduleDebouncedSync } from './sync'

function generateNodeId(): string {
  return (globalThis as any).crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// ===================
// 类型定义
// ===================

export type ViewMode = 'welcome' | 'editor' | 'outline' | 'mindmap'

interface TreeState {
  // State
  nodes: TreeNode[]
  selectedNodeId: string | null
  currentFolderId: string | null  // 当前浏览的文件夹 (null = 根目录)
  viewMode: ViewMode
  isLoading: boolean
}

interface TreeActions {
  // 数据加载
  loadNodes: () => void

  // CRUD
  createNode: (parentId: string | null, type: 'folder' | 'prompt') => string
  updateNode: (id: string, updates: Partial<TreeNode>) => void
  deleteNode: (id: string) => void
  moveNode: (id: string, newParentId: string | null) => void
  toggleFavorite: (id: string) => void

  // 导航
  setSelectedNode: (id: string | null) => void
  setCurrentFolder: (id: string | null) => void
  setViewMode: (mode: ViewMode) => void
  openNode: (id: string | null) => void
  openFolder: (id: string | null) => void
  openPrompt: (id: string) => void
  closeEditor: () => void

  // 查询
  getChildren: (parentId: string | null) => TreeNode[]
  getNode: (id: string) => TreeNode | undefined
  getRootTree: () => TreeNodeWithChildren[]
  getFavorites: () => TreeNode[]
  getBreadcrumbPath: (nodeId: string) => TreeNode[]
}

// ===================
// Store
// ===================

export const useTreeStore = create<TreeState & TreeActions>((set, get) => ({
  // ===================
  // State
  // ===================
  nodes: [],
  selectedNodeId: null,
  currentFolderId: null,
  viewMode: 'welcome',
  isLoading: false,

  // ===================
  // Actions
  // ===================

  /** 从 SQLite 加载所有节点 */
  loadNodes: () => {
    set({ isLoading: true })
    try {
      const nodes = dbOps.getActiveNodes()
      set({ nodes, isLoading: false })
    } catch (error) {
      console.error('加载节点失败:', error)
      set({ isLoading: false })
    }
  },

  /** 创建新节点，返回新节点 ID */
  createNode: (parentId, type) => {
    const { nodes } = get()
    // 计算同级最大 sortOrder
    const siblings = nodes.filter(n => n.parentId === parentId && !n.deletedAt)
    const maxSort = siblings.reduce((max, n) => Math.max(max, n.sortOrder), -1)

    const nodeData = createDefaultNode(parentId, type, maxSort + 1)
    const id = generateNodeId()
    const newNode: TreeNode = { ...nodeData, id }

    // 写入 SQLite
    dbOps.upsertNode(newNode, true)

    // 更新内存状态
    set(state => ({ nodes: [...state.nodes, newNode] }))
    scheduleDebouncedSync()

    return id
  },

  /** 更新节点 */
  updateNode: (id, updates) => {
    const { nodes } = get()
    const existing = nodes.find(n => n.id === id)
    if (!existing) return

    const updatedNode: TreeNode = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
      version: existing.version + 1,
    }

    // 写入 SQLite
    dbOps.upsertNode(updatedNode, true)

    // 更新内存状态
    set(state => ({
      nodes: state.nodes.map(n => (n.id === id ? updatedNode : n)),
    }))
    scheduleDebouncedSync()
  },

  /** 删除节点（软删除，含子孙） */
  deleteNode: (id) => {
    const { nodes, selectedNodeId, currentFolderId, viewMode } = get()

    // 找到所有子孙 ID
    const descendantIds = getDescendantIds(nodes, id)
    const idsToDelete = [id, ...descendantIds]
    const shouldClearSelection = idsToDelete.includes(selectedNodeId ?? '')
    const shouldResetFolder = idsToDelete.includes(currentFolderId ?? '')

    // SQLite 软删除
    dbOps.softDeleteNode(id)

    // 更新内存状态：过滤掉被删除的节点
    set(state => ({
      nodes: state.nodes.filter(n => !idsToDelete.includes(n.id)),
      selectedNodeId: shouldClearSelection ? null : selectedNodeId,
      currentFolderId: shouldResetFolder ? null : currentFolderId,
      viewMode: shouldClearSelection && viewMode === 'editor' ? 'welcome' : viewMode,
    }))
    scheduleDebouncedSync()
  },

  /** 移动节点到新父级 */
  moveNode: (id, newParentId) => {
    const { nodes } = get()
    const node = nodes.find(n => n.id === id)
    if (!node) return

    // 防止移动到自身的子孙下
    if (newParentId && (newParentId === id || getDescendantIds(nodes, id).includes(newParentId))) {
      return
    }

    // 计算新位置的 sortOrder
    const newSiblings = nodes.filter(n => n.parentId === newParentId && !n.deletedAt)
    const maxSort = newSiblings.reduce((max, n) => Math.max(max, n.sortOrder), -1)

    const updatedNode: TreeNode = {
      ...node,
      parentId: newParentId,
      sortOrder: maxSort + 1,
      updatedAt: Date.now(),
      version: node.version + 1,
    }

    dbOps.upsertNode(updatedNode, true)

    set(state => ({
      nodes: state.nodes.map(n => (n.id === id ? updatedNode : n)),
    }))
    scheduleDebouncedSync()
  },

  /** 切换收藏状态 */
  toggleFavorite: (id) => {
    const { nodes } = get()
    const node = nodes.find(n => n.id === id)
    if (!node) return

    const updatedNode: TreeNode = {
      ...node,
      isFavorite: !node.isFavorite,
      updatedAt: Date.now(),
      version: node.version + 1,
    }

    dbOps.upsertNode(updatedNode, true)

    set(state => ({
      nodes: state.nodes.map(n => (n.id === id ? updatedNode : n)),
    }))
    scheduleDebouncedSync()
  },

  /** 设置选中节点 */
  setSelectedNode: (id) => set({ selectedNodeId: id }),

  /** 设置当前浏览文件夹 */
  setCurrentFolder: (id) => set({ currentFolderId: id }),

  /** 设置视图模式 */
  setViewMode: (mode) => set({ viewMode: mode }),

  /** 按节点类型打开：文件夹 -> welcome，Prompt -> editor */
  openNode: (id) => {
    if (id === null) {
      get().openFolder(null)
      return
    }

    const target = get().nodes.find(n => n.id === id)
    if (!target) return

    if (target.type === 'folder') {
      get().openFolder(target.id)
      return
    }

    get().openPrompt(target.id)
  },

  /** 打开文件夹并回到欢迎视图 */
  openFolder: (id) => {
    if (id === null) {
      set({
        currentFolderId: null,
        selectedNodeId: null,
        viewMode: 'welcome',
      })
      return
    }

    const folderNode = get().nodes.find(n => n.id === id && n.type === 'folder')
    if (!folderNode) return

    set({
      currentFolderId: folderNode.id,
      selectedNodeId: folderNode.id,
      viewMode: 'welcome',
    })
  },

  /** 打开 Prompt 编辑器 */
  openPrompt: (id) => {
    const promptNode = get().nodes.find(n => n.id === id && n.type === 'prompt')
    if (!promptNode) return

    set({
      selectedNodeId: id,
      currentFolderId: promptNode.parentId,
      viewMode: 'editor',
    })
  },

  /** 关闭编辑器并回到工作台 */
  closeEditor: () => {
    set({
      selectedNodeId: null,
      viewMode: 'welcome',
    })
  },

  // ===================
  // Getters (查询方法)
  // ===================

  /** 获取指定父级的子节点 */
  getChildren: (parentId) => {
    const { nodes } = get()
    return nodes
      .filter(n => n.parentId === parentId && !n.deletedAt)
      .sort((a, b) => {
        // 文件夹排在 Prompt 前面
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.sortOrder - b.sortOrder
      })
  },

  /** 获取单个节点 */
  getNode: (id) => {
    return get().nodes.find(n => n.id === id)
  },

  /** 构建完整树结构 */
  getRootTree: () => {
    return buildTree(get().nodes)
  },

  /** 获取收藏节点 */
  getFavorites: () => {
    return get().nodes
      .filter(n => n.isFavorite && !n.deletedAt)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  },

  /** 获取面包屑路径 */
  getBreadcrumbPath: (nodeId) => {
    return getBreadcrumb(get().nodes, nodeId)
  },
}))
