import type { TreeNode, TreeNodeWithChildren } from './types'

/**
 * 将扁平节点列表构建为树结构
 */
export function buildTree(nodes: TreeNode[]): TreeNodeWithChildren[] {
  const nodeMap = new Map<string, TreeNodeWithChildren>()
  
  // 创建所有节点的副本
  for (const node of nodes) {
    if (!node.deletedAt) {
      nodeMap.set(node.id, { ...node, children: [] })
    }
  }
  
  const roots: TreeNodeWithChildren[] = []
  
  // 构建父子关系
  for (const node of nodeMap.values()) {
    if (node.parentId === null) {
      roots.push(node)
    } else {
      const parent = nodeMap.get(node.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // 父节点不存在，作为根节点
        roots.push(node)
      }
    }
  }
  
  // 递归排序
  sortChildren(roots)
  
  return roots
}

/**
 * 递归排序子节点
 */
function sortChildren(nodes: TreeNodeWithChildren[]): void {
  nodes.sort((a, b) => a.sortOrder - b.sortOrder)
  for (const node of nodes) {
    if (node.children.length > 0) {
      sortChildren(node.children)
    }
  }
}

/**
 * 查找节点
 */
export function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
  return nodes.find(n => n.id === id)
}

/**
 * 获取节点的所有子孙节点 ID
 */
export function getDescendantIds(nodes: TreeNode[], parentId: string): string[] {
  const ids: string[] = []
  const children = nodes.filter(n => n.parentId === parentId)
  
  for (const child of children) {
    ids.push(child.id)
    ids.push(...getDescendantIds(nodes, child.id))
  }
  
  return ids
}

/**
 * 检查 nodeId 是否是 targetId 的祖先节点
 */
export function isAncestor(nodes: TreeNode[], nodeId: string, targetId: string): boolean {
  const target = nodes.find(n => n.id === targetId)
  if (!target) return false
  
  if (target.parentId === null) return false
  if (target.parentId === nodeId) return true
  
  return isAncestor(nodes, nodeId, target.parentId)
}

/**
 * 获取面包屑路径
 */
export function getBreadcrumb(nodes: TreeNode[], nodeId: string): TreeNode[] {
  const path: TreeNode[] = []
  let currentId: string | null = nodeId
  
  while (currentId) {
    const node = nodes.find(n => n.id === currentId)
    if (!node) break
    path.unshift(node)
    currentId = node.parentId
  }
  
  return path
}

/**
 * 生成新节点的默认值
 */
export function createDefaultNode(
  parentId: string | null,
  type: 'folder' | 'prompt',
  sortOrder: number
): Omit<TreeNode, 'id'> {
  const now = Date.now()
  return {
    parentId,
    type,
    title: '',
    content: '',
    isFavorite: false,
    sortOrder,
    collapsed: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1
  }
}
