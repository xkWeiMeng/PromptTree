import { create } from 'zustand'
import type { TreeNode, TreeNodeWithChildren } from '@prompttree/shared'
import { buildTree, getDescendantIds, createDefaultNode, getBreadcrumb } from '@prompttree/shared'
import * as dbOps from '../db/operations'

// ===================
// 类型定义
// ===================

interface TreeState {
  // State
  nodes: TreeNode[]
  selectedNodeId: string | null
  currentFolderId: string | null  // 当前浏览的文件夹 (null = 根目录)
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
    const id = crypto.randomUUID()
    const newNode: TreeNode = { ...nodeData, id }

    // 写入 SQLite
    dbOps.upsertNode(newNode, true)

    // 更新内存状态
    set(state => ({ nodes: [...state.nodes, newNode] }))

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
  },

  /** 删除节点（软删除，含子孙） */
  deleteNode: (id) => {
    const { nodes, selectedNodeId } = get()

    // 找到所有子孙 ID
    const descendantIds = getDescendantIds(nodes, id)
    const idsToDelete = [id, ...descendantIds]

    // SQLite 软删除
    dbOps.softDeleteNode(id)

    // 更新内存状态：过滤掉被删除的节点
    set(state => ({
      nodes: state.nodes.filter(n => !idsToDelete.includes(n.id)),
      selectedNodeId: idsToDelete.includes(selectedNodeId ?? '') ? null : selectedNodeId,
    }))
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
  },

  /** 设置选中节点 */
  setSelectedNode: (id) => set({ selectedNodeId: id }),

  /** 设置当前浏览文件夹 */
  setCurrentFolder: (id) => set({ currentFolderId: id }),

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
