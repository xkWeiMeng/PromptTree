import type { TreeNode, SyncChange, SyncRequest, SyncResponse } from './types'

/**
 * 比较本地和服务端数据，生成变更列表
 */
export function computeLocalChanges(
  localNodes: TreeNode[],
  lastSyncTime: number
): SyncChange[] {
  const changes: SyncChange[] = []
  
  for (const node of localNodes) {
    // 节点在上次同步后有更新
    if (node.updatedAt > lastSyncTime) {
      changes.push({
        id: node.id,
        action: node.deletedAt ? 'delete' : 'upsert',
        data: node.deletedAt ? undefined : node
      })
    }
  }
  
  return changes
}

/**
 * 合并服务端变更到本地
 * 采用 Last Write Wins 策略
 */
export function mergeServerChanges(
  localNodes: TreeNode[],
  serverChanges: SyncChange[]
): TreeNode[] {
  const nodeMap = new Map(localNodes.map(n => [n.id, n]))
  
  for (const change of serverChanges) {
    if (change.action === 'delete') {
      const existing = nodeMap.get(change.id)
      if (existing) {
        nodeMap.set(change.id, { ...existing, deletedAt: Date.now() })
      }
    } else if (change.action === 'upsert' && change.data) {
      const existing = nodeMap.get(change.id)
      
      // Last Write Wins：服务端更新时间更新则采用服务端版本
      if (!existing || change.data.updatedAt > existing.updatedAt) {
        nodeMap.set(change.id, change.data)
      }
    }
  }
  
  return Array.from(nodeMap.values())
}

/**
 * 创建同步请求
 */
export function createSyncRequest(
  localNodes: TreeNode[],
  lastSyncTime: number
): SyncRequest {
  return {
    lastSyncTime,
    changes: computeLocalChanges(localNodes, lastSyncTime)
  }
}

/**
 * 处理同步响应
 */
export function processSyncResponse(
  localNodes: TreeNode[],
  response: SyncResponse
): { nodes: TreeNode[]; newSyncTime: number } {
  const mergedNodes = mergeServerChanges(localNodes, response.changes)
  
  return {
    nodes: mergedNodes,
    newSyncTime: response.serverTime
  }
}
