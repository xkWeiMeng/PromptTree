import type { LocalNode } from '@/db'
import { getOrCreateShareVisitorId, getShareEligibility } from '@/utils/share'

function createNode(overrides: Partial<LocalNode>): LocalNode {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    parentId: null,
    type: 'prompt',
    title: '测试节点',
    content: 'content',
    isFavorite: false,
    sortOrder: 0,
    collapsed: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    _dirty: false,
    _pendingSync: false,
    ...overrides
  }
}

describe('share utils', () => {
  describe('getShareEligibility', () => {
    it('应该在未登录时禁止分享', () => {
      const node = createNode({})
      const result = getShareEligibility(node.id, [node], {
        isLoggedIn: false,
        isOfflineMode: false
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('notLoggedIn')
    })

    it('应该在离线模式时禁止分享', () => {
      const node = createNode({})
      const result = getShareEligibility(node.id, [node], {
        isLoggedIn: true,
        isOfflineMode: true
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('offlineMode')
    })

    it('应该在节点未同步时禁止分享', () => {
      const node = createNode({ _dirty: true })
      const result = getShareEligibility(node.id, [node], {
        isLoggedIn: true,
        isOfflineMode: false
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('nodeDirty')
    })

    it('应该在文件夹包含未同步子节点时禁止分享', () => {
      const folder = createNode({ id: 'folder-1', type: 'folder' })
      const prompt = createNode({ id: 'prompt-1', parentId: 'folder-1', _dirty: true })

      const result = getShareEligibility(folder.id, [folder, prompt], {
        isLoggedIn: true,
        isOfflineMode: false
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('descendantDirty')
    })

    it('应该在在线且已同步时允许分享', () => {
      const folder = createNode({ id: 'folder-1', type: 'folder' })
      const prompt = createNode({ id: 'prompt-1', parentId: 'folder-1', _dirty: false })

      const result = getShareEligibility(folder.id, [folder, prompt], {
        isLoggedIn: true,
        isOfflineMode: false
      })

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })
  })

  describe('getOrCreateShareVisitorId', () => {
    it('应该复用同一个访客标识', () => {
      localStorage.clear()

      const first = getOrCreateShareVisitorId()
      const second = getOrCreateShareVisitorId()

      expect(first).toBe(second)
      expect(first.length).toBeGreaterThan(0)
    })
  })
})
