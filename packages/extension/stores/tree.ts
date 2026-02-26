import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TreeNode, TreeNodeWithChildren } from '@prompttree/shared'
import { buildTree, getDescendantIds, isAncestor, getBreadcrumb } from '@prompttree/shared'
import type { LocalNode } from '@/utils/storage'
import * as storage from '@/utils/storage'

export const useTreeStore = defineStore('tree', () => {
  // ===================
  // State
  // ===================
  const nodes = ref<LocalNode[]>([])
  const selectedNodeId = ref<string | null>(null)
  const expandedIds = ref<Set<string>>(new Set())
  const currentFolderId = ref<string | null>(null) // 层级导航当前文件夹
  const isLoading = ref(false)

  // ===================
  // Getters
  // ===================

  /** 树形结构（过滤已删除） */
  const rootNodes = computed<TreeNodeWithChildren[]>(() => {
    const activeNodes = nodes.value.filter(n => n.deletedAt === null)
    return buildTree(activeNodes)
  })

  /** 当前文件夹下的子节点（层级浏览模式） */
  const currentFolderNodes = computed(() => {
    return nodes.value.filter(
      n => n.parentId === currentFolderId.value && n.deletedAt === null
    ).sort((a, b) => a.sortOrder - b.sortOrder)
  })

  /** 当前选中节点 */
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return nodes.value.find(n => n.id === selectedNodeId.value) ?? null
  })

  /** 收藏节点 */
  const favoriteNodes = computed(() => {
    return nodes.value.filter(n => n.isFavorite && n.deletedAt === null)
  })

  /** 面包屑导航 */
  const breadcrumb = computed(() => {
    if (!currentFolderId.value) return []
    return getBreadcrumb(nodes.value, currentFolderId.value)
  })

  // ===================
  // Actions
  // ===================

  /** 从 chrome.storage 加载节点 */
  async function init() {
    isLoading.value = true
    try {
      nodes.value = await storage.getNodes()
    } finally {
      isLoading.value = false
    }
  }

  /** 获取单个节点 */
  function getNode(id: string): LocalNode | undefined {
    return nodes.value.find(n => n.id === id)
  }

  /** 创建新节点 */
  interface CreateNodeOptions {
    type: 'folder' | 'prompt'
    parentId?: string | null
    title?: string
    content?: string
  }

  async function createNode(options: CreateNodeOptions): Promise<TreeNode> {
    const { type, parentId = currentFolderId.value, title, content = '' } = options
    const now = Date.now()

    // 计算 sortOrder（同级最大值 + 1）
    const siblings = nodes.value.filter(
      n => n.parentId === parentId && n.deletedAt === null
    )
    const maxOrder = Math.max(0, ...siblings.map(n => n.sortOrder))

    const newNode: TreeNode = {
      id: crypto.randomUUID(),
      parentId: parentId ?? null,
      type,
      title: title || (type === 'folder' ? '新建文件夹' : '新建 Prompt'),
      content,
      isFavorite: false,
      sortOrder: maxOrder + 1,
      collapsed: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    }

    // 写入 storage
    await storage.upsertNode(newNode, true)

    // 更新内存
    nodes.value.push({
      ...newNode,
      _dirty: true,
      _pendingSync: false,
    })

    // 自动展开父节点
    if (parentId) {
      expandedIds.value.add(parentId)
    }

    // 选中新节点
    selectedNodeId.value = newNode.id

    return newNode
  }

  /** 更新节点 */
  async function updateNode(id: string, updates: Partial<TreeNode>) {
    const now = Date.now()
    const node = nodes.value.find(n => n.id === id)
    if (!node) return

    // 更新内存
    Object.assign(node, updates, {
      updatedAt: now,
      version: node.version + 1,
      _dirty: true,
    })

    // 更新 storage
    await storage.updateNode(id, {
      ...updates,
      updatedAt: now,
      version: node.version,
    })
  }

  /** 删除节点（及其子节点） */
  async function deleteNode(id: string) {
    const now = Date.now()

    const idsToDelete = [id, ...getDescendantIds(nodes.value, id)]

    for (const nodeId of idsToDelete) {
      const node = nodes.value.find(n => n.id === nodeId)
      if (node) {
        node.deletedAt = now
        node.updatedAt = now
        node._dirty = true
      }
    }

    await storage.deleteNode(id)

    // 如果删除的是选中节点，清除选中
    if (selectedNodeId.value && idsToDelete.includes(selectedNodeId.value)) {
      selectedNodeId.value = null
    }
  }

  /** 移动节点 */
  async function moveNode(id: string, newParentId: string | null, newSortOrder: number) {
    const node = nodes.value.find(n => n.id === id)
    if (!node) return

    // 防止移动到自己的子节点
    if (newParentId && isAncestor(nodes.value, id, newParentId)) {
      console.warn('Cannot move node into its descendant')
      return
    }

    const now = Date.now()

    // 更新移动的节点
    node.parentId = newParentId
    node.sortOrder = newSortOrder
    node.updatedAt = now
    node._dirty = true

    await storage.updateNode(id, {
      parentId: newParentId,
      sortOrder: newSortOrder,
    })
  }

  /** 切换收藏 */
  async function toggleFavorite(id: string) {
    const node = nodes.value.find(n => n.id === id)
    if (!node) return
    await updateNode(id, { isFavorite: !node.isFavorite })
  }

  /** 切换展开/折叠 */
  function toggleExpanded(id: string) {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id)
    } else {
      expandedIds.value.add(id)
    }
  }

  /** 选中节点 */
  function selectNode(id: string | null) {
    selectedNodeId.value = id
  }

  /** 全部展开 */
  function expandAll() {
    nodes.value
      .filter(n => n.type === 'folder' && n.deletedAt === null)
      .forEach(n => expandedIds.value.add(n.id))
  }

  /** 全部折叠 */
  function collapseAll() {
    expandedIds.value.clear()
  }

  /** 层级导航：进入文件夹 */
  function navigateToFolder(id: string | null) {
    currentFolderId.value = id
    selectedNodeId.value = null
  }

  /** 层级导航：返回上一级 */
  function navigateUp() {
    if (!currentFolderId.value) return
    const current = nodes.value.find(n => n.id === currentFolderId.value)
    currentFolderId.value = current?.parentId ?? null
    selectedNodeId.value = null
  }

  /** 设置节点（同步后） */
  async function setNodes(newNodes: TreeNode[]) {
    await storage.upsertNodes(newNodes, false)
    nodes.value = await storage.getNodes()
  }

  /** 清空所有节点 */
  async function clearNodes() {
    await storage.clearAllNodes()
    nodes.value = []
    selectedNodeId.value = null
    expandedIds.value.clear()
    currentFolderId.value = null
  }

  return {
    // State
    nodes,
    selectedNodeId,
    expandedIds,
    currentFolderId,
    isLoading,
    // Getters
    rootNodes,
    currentFolderNodes,
    selectedNode,
    favoriteNodes,
    breadcrumb,
    // Actions
    init,
    getNode,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    toggleFavorite,
    toggleExpanded,
    selectNode,
    expandAll,
    collapseAll,
    navigateToFolder,
    navigateUp,
    setNodes,
    clearNodes,
  }
})
