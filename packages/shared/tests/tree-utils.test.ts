import { describe, it, expect } from 'vitest'
import { buildTree, findNode, getDescendantIds, isAncestor, getBreadcrumb } from '../src/tree-utils'
import type { TreeNode } from '../src/types'

// 辅助函数：创建节点
function createNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'test-id',
    parentId: null,
    type: 'prompt',
    title: 'Test',
    content: '',
    isFavorite: false,
    sortOrder: 0,
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
    version: 1,
    ...overrides
  }
}

describe('tree-utils', () => {
  describe('buildTree', () => {
    it('应该将扁平列表构建为树结构', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'root', type: 'folder', title: 'Root' }),
        createNode({ id: 'child1', parentId: 'root', title: 'Child 1', sortOrder: 1 }),
        createNode({ id: 'child2', parentId: 'root', title: 'Child 2', sortOrder: 2 })
      ]

      const tree = buildTree(nodes)
      
      expect(tree).toHaveLength(1)
      expect(tree[0].id).toBe('root')
      expect(tree[0].children).toHaveLength(2)
      expect(tree[0].children[0].id).toBe('child1')
      expect(tree[0].children[1].id).toBe('child2')
    })

    it('应该按 sortOrder 排序', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'root', type: 'folder' }),
        createNode({ id: 'b', parentId: 'root', sortOrder: 2 }),
        createNode({ id: 'a', parentId: 'root', sortOrder: 1 }),
        createNode({ id: 'c', parentId: 'root', sortOrder: 3 })
      ]

      const tree = buildTree(nodes)
      
      expect(tree[0].children.map(c => c.id)).toEqual(['a', 'b', 'c'])
    })

    it('应该过滤已删除的节点', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'root', type: 'folder' }),
        createNode({ id: 'deleted', parentId: 'root', deletedAt: Date.now() }),
        createNode({ id: 'active', parentId: 'root' })
      ]

      const tree = buildTree(nodes)
      
      expect(tree[0].children).toHaveLength(1)
      expect(tree[0].children[0].id).toBe('active')
    })

    it('孤儿节点应作为根节点', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'orphan', parentId: 'non-existent' })
      ]

      const tree = buildTree(nodes)
      
      expect(tree).toHaveLength(1)
      expect(tree[0].id).toBe('orphan')
    })
  })

  describe('findNode', () => {
    it('应该找到存在的节点', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'a' }),
        createNode({ id: 'b' }),
        createNode({ id: 'c' })
      ]

      expect(findNode(nodes, 'b')?.id).toBe('b')
    })

    it('节点不存在时返回 undefined', () => {
      const nodes: TreeNode[] = [createNode({ id: 'a' })]
      
      expect(findNode(nodes, 'not-exist')).toBeUndefined()
    })
  })

  describe('getDescendantIds', () => {
    it('应该获取所有子孙节点 ID', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'root', type: 'folder' }),
        createNode({ id: 'child', parentId: 'root', type: 'folder' }),
        createNode({ id: 'grandchild', parentId: 'child' })
      ]

      const ids = getDescendantIds(nodes, 'root')
      
      expect(ids).toContain('child')
      expect(ids).toContain('grandchild')
      expect(ids).toHaveLength(2)
    })

    it('没有子节点时返回空数组', () => {
      const nodes: TreeNode[] = [createNode({ id: 'leaf' })]
      
      expect(getDescendantIds(nodes, 'leaf')).toEqual([])
    })
  })

  describe('isAncestor', () => {
    it('直接父节点应返回 true', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'parent', type: 'folder' }),
        createNode({ id: 'child', parentId: 'parent' })
      ]

      expect(isAncestor(nodes, 'parent', 'child')).toBe(true)
    })

    it('祖先节点应返回 true', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'grandparent', type: 'folder' }),
        createNode({ id: 'parent', parentId: 'grandparent', type: 'folder' }),
        createNode({ id: 'child', parentId: 'parent' })
      ]

      expect(isAncestor(nodes, 'grandparent', 'child')).toBe(true)
    })

    it('非祖先节点应返回 false', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'a', type: 'folder' }),
        createNode({ id: 'b' })
      ]

      expect(isAncestor(nodes, 'a', 'b')).toBe(false)
    })

    it('根节点没有祖先', () => {
      const nodes: TreeNode[] = [createNode({ id: 'root' })]
      
      expect(isAncestor(nodes, 'root', 'root')).toBe(false)
    })
  })

  describe('getBreadcrumb', () => {
    it('应该返回从根到当前节点的路径', () => {
      const nodes: TreeNode[] = [
        createNode({ id: 'root', title: 'Root', type: 'folder' }),
        createNode({ id: 'parent', parentId: 'root', title: 'Parent', type: 'folder' }),
        createNode({ id: 'child', parentId: 'parent', title: 'Child' })
      ]

      const path = getBreadcrumb(nodes, 'child')
      
      expect(path.map(n => n.title)).toEqual(['Root', 'Parent', 'Child'])
    })

    it('根节点的路径只包含自己', () => {
      const nodes: TreeNode[] = [createNode({ id: 'root', title: 'Root' })]

      const path = getBreadcrumb(nodes, 'root')
      
      expect(path).toHaveLength(1)
      expect(path[0].title).toBe('Root')
    })
  })
})
