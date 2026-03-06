import { getDescendantIds } from '@prompttree/shared'
import type { LocalNode } from '@/db'

export type ShareBlockedReason =
  | 'notLoggedIn'
  | 'offlineMode'
  | 'nodeNotFound'
  | 'nodeDirty'
  | 'descendantDirty'

export interface ShareEligibility {
  allowed: boolean
  reason?: ShareBlockedReason
}

const SHARE_VISITOR_ID_KEY = 'prompttree-share-visitor-id'

/**
 * 校验节点是否允许分享（仅在线且已同步）
 */
export function getShareEligibility(
  nodeId: string,
  nodes: LocalNode[],
  auth: { isLoggedIn: boolean; isOfflineMode: boolean }
): ShareEligibility {
  if (!auth.isLoggedIn) {
    return { allowed: false, reason: 'notLoggedIn' }
  }

  if (auth.isOfflineMode) {
    return { allowed: false, reason: 'offlineMode' }
  }

  const target = nodes.find((node) => node.id === nodeId && node.deletedAt === null)
  if (!target) {
    return { allowed: false, reason: 'nodeNotFound' }
  }

  if (target._dirty) {
    return { allowed: false, reason: 'nodeDirty' }
  }

  if (target.type === 'folder') {
    const descendantIds = getDescendantIds(
      nodes.filter((node) => node.deletedAt === null),
      nodeId
    )
    const dirtyDescendant = nodes.find(
      (node) => descendantIds.includes(node.id) && node.deletedAt === null && node._dirty
    )

    if (dirtyDescendant) {
      return { allowed: false, reason: 'descendantDirty' }
    }
  }

  return { allowed: true }
}

/**
 * 获取访客标识（用于 UV 统计）
 */
export function getOrCreateShareVisitorId(): string {
  const stored = localStorage.getItem(SHARE_VISITOR_ID_KEY)
  if (stored) {
    return stored
  }

  const visitorId = crypto.randomUUID()
  localStorage.setItem(SHARE_VISITOR_ID_KEY, visitorId)
  return visitorId
}
