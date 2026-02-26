import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock IndexedDB operations
vi.mock('@/db/operations', () => ({
  getActiveNodes: vi.fn().mockResolvedValue([]),
  upsertNode: vi.fn().mockResolvedValue(undefined),
  updateNode: vi.fn().mockResolvedValue(undefined),
  deleteNode: vi.fn().mockResolvedValue(undefined),
  clearAllNodes: vi.fn().mockResolvedValue(undefined),
  upsertNodes: vi.fn().mockResolvedValue(undefined)
}))

import { useTreeStore } from '@/stores/tree'

describe('useTreeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('初始状态', () => {
    it('应该有空的节点列表', () => {
      const store = useTreeStore()
      expect(store.nodes).toEqual([])
    })

    it('应该没有选中节点', () => {
      const store = useTreeStore()
      expect(store.selectedNodeId).toBeNull()
    })

    it('应该有空的展开集合', () => {
      const store = useTreeStore()
      expect(store.expandedIds.size).toBe(0)
    })
  })

  describe('createNode', () => {
    it('应该创建新节点', async () => {
      const store = useTreeStore()
      
      const node = await store.createNode({ type: 'prompt', title: '测试 Prompt' })
      
      expect(node.id).toBeDefined()
      expect(node.title).toBe('测试 Prompt')
      expect(node.type).toBe('prompt')
      expect(node.parentId).toBeNull()
    })

    it('创建后应该自动选中新节点', async () => {
      const store = useTreeStore()
      
      const node = await store.createNode({ type: 'folder', title: '测试文件夹' })
      
      expect(store.selectedNodeId).toBe(node.id)
    })

    it('应该设置默认标题', async () => {
      const store = useTreeStore()
      
      const folder = await store.createNode({ type: 'folder' })
      const prompt = await store.createNode({ type: 'prompt' })
      
      expect(folder.title).toBe('新建文件夹')
      expect(prompt.title).toBe('新建 Prompt')
    })
  })

  describe('selectNode', () => {
    it('应该更新选中的节点 ID', () => {
      const store = useTreeStore()
      
      store.selectNode('test-id')
      
      expect(store.selectedNodeId).toBe('test-id')
    })

    it('可以取消选中', () => {
      const store = useTreeStore()
      store.selectNode('test-id')
      
      store.selectNode(null)
      
      expect(store.selectedNodeId).toBeNull()
    })
  })

  describe('toggleExpanded', () => {
    it('应该展开折叠的节点', () => {
      const store = useTreeStore()
      
      store.toggleExpanded('folder-1')
      
      expect(store.expandedIds.has('folder-1')).toBe(true)
    })

    it('应该折叠展开的节点', () => {
      const store = useTreeStore()
      store.toggleExpanded('folder-1')
      
      store.toggleExpanded('folder-1')
      
      expect(store.expandedIds.has('folder-1')).toBe(false)
    })
  })

  describe('rootNodes (computed)', () => {
    it('应该返回树形结构', async () => {
      const store = useTreeStore()
      
      // 创建文件夹和子节点
      const folder = await store.createNode({ type: 'folder', title: '文件夹' })
      await store.createNode({ type: 'prompt', title: '子 Prompt', parentId: folder.id })

      expect(store.rootNodes.length).toBeGreaterThanOrEqual(1)
    })
  })
})
