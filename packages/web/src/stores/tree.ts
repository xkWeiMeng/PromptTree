import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TreeNode, TreeNodeWithChildren } from '@prompttree/shared'
import { buildTree } from '@prompttree/shared'
import * as dbOps from '@/db/operations'
import type { LocalNode } from '@/db'
import { i18n } from '@/i18n'
import { useToast } from '@/composables'

/**
 * 检查 targetId 是否是 nodeId 的后代
 */
function isDescendant(
  nodes: LocalNode[],
  nodeId: string,
  targetId: string
): boolean {
  let current = nodes.find((n: LocalNode) => n.id === targetId)
  while (current) {
    if (current.parentId === nodeId) return true
    current = nodes.find((n: LocalNode) => n.id === current!.parentId)
  }
  return false
}

/** 视图模式 */
export type ViewMode = 'welcome' | 'editor' | 'outline' | 'mindmap'

export const useTreeStore = defineStore('tree', () => {
  // ===================
  // State
  // ===================
  const nodes = ref<LocalNode[]>([])
  const selectedNodeId = ref<string | null>(null)
  const expandedIds = ref<Set<string>>(new Set())
  const isLoading = ref(false)
  const viewMode = ref<ViewMode>('welcome')
  const mindmapRootId = ref<string | null>(null)
  const editingNodeId = ref<string | null>(null)

  // ===================
  // Getters
  // ===================
  
  /** 树形结构（缓存上次结果，仅当活跃节点真正变化时重建） */
  let _prevActiveIds: string | null = null
  let _prevUpdatedKeys: string | null = null
  let _cachedTree: TreeNodeWithChildren[] = []

  const rootNodes = computed<TreeNodeWithChildren[]>(() => {
    const activeNodes = nodes.value.filter((n: LocalNode) => n.deletedAt === null)
    // 构建快照指纹：id + parentId + sortOrder + updatedAt 决定树结构
    const idKey = activeNodes.map(n => n.id).join(',')
    const updatedKey = activeNodes.map(n => `${n.parentId}|${n.sortOrder}|${n.updatedAt}`).join(',')
    if (idKey === _prevActiveIds && updatedKey === _prevUpdatedKeys) {
      return _cachedTree
    }
    _prevActiveIds = idKey
    _prevUpdatedKeys = updatedKey
    _cachedTree = buildTree(activeNodes)
    return _cachedTree
  })

  /** 当前选中的节点 */
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return nodes.value.find((n: LocalNode) => n.id === selectedNodeId.value) ?? null
  })

  /** 收藏节点 */
  const favoriteNodes = computed(() => {
    return nodes.value.filter((n: LocalNode) => n.isFavorite && n.deletedAt === null)
  })

  /** 最近编辑/访问的节点（按 updatedAt 降序，最多 10 个，排除已删除） */
  const recentNodes = computed(() => {
    return nodes.value
      .filter((n: LocalNode) => n.deletedAt === null)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10)
  })

  // ===================
  // Actions
  // ===================

  /**
   * 从本地数据库加载节点
   */
  async function loadFromDB() {
    isLoading.value = true
    try {
      nodes.value = await dbOps.getActiveNodes()
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取节点
   */
  function getNode(id: string): LocalNode | undefined {
    return nodes.value.find((n: LocalNode) => n.id === id)
  }

  /**
   * 创建新节点参数
   */
  interface CreateNodeOptions {
    type: 'folder' | 'prompt'
    parentId?: string | null
    title?: string
    content?: string
  }

  /**
   * 创建新节点
   */
  async function createNode(options: CreateNodeOptions): Promise<TreeNode> {
    const { type, parentId = null, title, content = '' } = options
    const now = Date.now()
    
    // 计算 sortOrder（同级最大值 + 1）
    const siblings = nodes.value.filter((n: LocalNode) => n.parentId === parentId && n.deletedAt === null)
    const maxOrder = Math.max(0, ...siblings.map((n: LocalNode) => n.sortOrder))
    
    const newNode: TreeNode = {
      id: crypto.randomUUID(),
      parentId,
      type,
      title: title || (type === 'folder' ? i18n.global.t('tree.newFolder') : i18n.global.t('tree.newPrompt')),
      content,
      isFavorite: false,
      sortOrder: maxOrder + 1,
      collapsed: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1
    }
    
    // 保存到数据库
    await dbOps.upsertNode(newNode, true)
    
    // 更新内存状态
    nodes.value.push({
      ...newNode,
      _dirty: true,
      _pendingSync: false
    })
    
    // 自动展开父节点
    if (parentId) {
      expandedIds.value.add(parentId)
    }
    
    // 选中新节点
    selectedNodeId.value = newNode.id
    
    // 成功提示
    const toast = useToast()
    toast.success(i18n.global.t('tree.nodeCreated'))
    
    return newNode
  }

  /**
   * 更新节点
   */
  async function updateNode(id: string, updates: Partial<TreeNode>) {
    const now = Date.now()
    const node = nodes.value.find((n: LocalNode) => n.id === id)
    if (!node) return
    
    // 更新内存
    Object.assign(node, updates, {
      updatedAt: now,
      version: node.version + 1,
      _dirty: true
    })
    
    // 更新数据库
    await dbOps.updateNode(id, {
      ...updates,
      updatedAt: now,
      version: node.version
    })
  }

  /**
   * 删除节点（及其子节点）
   */
  async function deleteNode(id: string) {
    const now = Date.now()
    
    // 递归获取所有需要删除的节点 ID
    const idsToDelete: string[] = []
    const collectIds = (nodeId: string) => {
      idsToDelete.push(nodeId)
      nodes.value
        .filter((n: LocalNode) => n.parentId === nodeId && n.deletedAt === null)
        .forEach((child: LocalNode) => collectIds(child.id))
    }
    collectIds(id)
    
    // 更新内存和数据库
    for (const nodeId of idsToDelete) {
      const node = nodes.value.find((n: LocalNode) => n.id === nodeId)
      if (node) {
        node.deletedAt = now
        node.updatedAt = now
        node._dirty = true
        await dbOps.deleteNode(nodeId)
      }
    }
    
    // 如果删除的是选中节点，清除选中并回到欢迎页
    if (selectedNodeId.value && idsToDelete.includes(selectedNodeId.value)) {
      selectedNodeId.value = null
      if (viewMode.value === 'editor') {
        viewMode.value = 'welcome'
      }
    }
    
    // 成功提示
    const toast = useToast()
    toast.success(i18n.global.t('tree.nodeDeleted'))
  }

  /**
   * 移动节点
   */
  async function moveNode(
    id: string,
    newParentId: string | null,
    newSortOrder: number
  ) {
    const node = nodes.value.find((n: LocalNode) => n.id === id)
    if (!node) return
    
    // 防止移动到自己的子节点
    if (newParentId && isDescendant(nodes.value, id, newParentId)) {
      console.warn('Cannot move node into its descendant')
      return
    }
    
    const now = Date.now()
    
    // 更新排序：移动同级其他节点
    const newSiblings = nodes.value.filter(
      (n: LocalNode) => n.parentId === newParentId && n.id !== id && n.deletedAt === null
    )
    
    // 为其他节点重新排序
    newSiblings
      .filter((n: LocalNode) => n.sortOrder >= newSortOrder)
      .forEach((n: LocalNode) => {
        n.sortOrder += 1
        n.updatedAt = now
        n._dirty = true
      })
    
    // 更新移动的节点
    node.parentId = newParentId
    node.sortOrder = newSortOrder
    node.updatedAt = now
    node._dirty = true
    
    // 保存到数据库
    await dbOps.updateNode(id, {
      parentId: newParentId,
      sortOrder: newSortOrder
    })
    
    // 成功提示
    const toast = useToast()
    toast.success(i18n.global.t('tree.nodeMoved'))
  }

  /**
   * 切换收藏
   */
  async function toggleFavorite(id: string) {
    const node = nodes.value.find((n: LocalNode) => n.id === id)
    if (!node) return
    
    const willFavorite = !node.isFavorite
    await updateNode(id, { isFavorite: willFavorite })
    
    // 成功提示
    const toast = useToast()
    toast.success(i18n.global.t(willFavorite ? 'tree.favoriteAdded' : 'tree.favoriteRemoved'))
  }

  /**
   * 切换展开/折叠
   */
  function toggleExpanded(id: string) {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id)
    } else {
      expandedIds.value.add(id)
    }
  }

  /**
   * 选中节点
   */
  function selectNode(id: string | null) {
    selectedNodeId.value = id
    if (id) {
      const node = nodes.value.find((n: LocalNode) => n.id === id)
      if (node?.type === 'prompt') {
        viewMode.value = 'editor'
      }
    }
  }

  /**
   * 关闭编辑器，回到欢迎页
   */
  function closeEditor() {
    selectedNodeId.value = null
    viewMode.value = 'welcome'
  }

  /**
   * 设置视图模式
   */
  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  /**
   * 设置思维导图根节点
   */
  function setMindmapRoot(id: string | null) {
    mindmapRootId.value = id
  }

  /**
   * 开始重命名节点
   */
  function startEditing(id: string) {
    editingNodeId.value = id
  }

  /**
   * 停止重命名
   */
  function stopEditing() {
    editingNodeId.value = null
  }

  /**
   * 全部展开
   */
  function expandAll() {
    nodes.value
      .filter((n: LocalNode) => n.type === 'folder' && n.deletedAt === null)
      .forEach((n: LocalNode) => expandedIds.value.add(n.id))
  }

  /**
   * 全部折叠
   */
  function collapseAll() {
    expandedIds.value.clear()
  }

  /**
   * 设置节点（从服务端同步后）
   */
  async function setNodes(newNodes: TreeNode[]) {
    await dbOps.upsertNodes(newNodes, false)
    nodes.value = await dbOps.getActiveNodes()
  }

  /**
   * 清空所有节点
   */
  async function clearNodes() {
    await dbOps.clearAllNodes()
    nodes.value = []
    selectedNodeId.value = null
    expandedIds.value.clear()
  }

  return {
    // State
    nodes,
    selectedNodeId,
    expandedIds,
    isLoading,
    viewMode,
    mindmapRootId,
    editingNodeId,
    // Getters
    rootNodes,
    selectedNode,
    favoriteNodes,
    recentNodes,
    // Actions
    loadFromDB,
    getNode,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    toggleFavorite,
    toggleExpanded,
    selectNode,
    closeEditor,
    setViewMode,
    setMindmapRoot,
    startEditing,
    stopEditing,
    expandAll,
    collapseAll,
    setNodes,
    clearNodes
  }
})
