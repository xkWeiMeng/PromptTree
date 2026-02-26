import { db, META_KEYS, type LocalNode } from './index'
import type { TreeNode } from '@prompttree/shared'

// ===================
// 节点操作
// ===================

/**
 * 获取所有节点
 */
export async function getAllNodes(): Promise<LocalNode[]> {
  return db.nodes.toArray()
}

/**
 * 获取所有未删除的节点
 */
export async function getActiveNodes(): Promise<LocalNode[]> {
  return db.nodes.filter((n: LocalNode) => n.deletedAt === null).toArray()
}

/**
 * 根据 ID 获取节点
 */
export async function getNodeById(id: string): Promise<LocalNode | undefined> {
  return db.nodes.get(id)
}

/**
 * 获取子节点
 */
export async function getChildNodes(parentId: string | null): Promise<LocalNode[]> {
  return db.nodes
    .where('parentId')
    .equals(parentId ?? '')
    .filter((n: LocalNode) => n.deletedAt === null)
    .sortBy('sortOrder')
}

/**
 * 获取收藏节点
 */
export async function getFavoriteNodes(): Promise<LocalNode[]> {
  return db.nodes
    .where('isFavorite')
    .equals(1)
    .filter((n: LocalNode) => n.deletedAt === null)
    .toArray()
}

/**
 * 获取脏数据（待同步）
 */
export async function getDirtyNodes(): Promise<LocalNode[]> {
  return db.nodes.where('_dirty').equals(1).toArray()
}

/**
 * 插入或更新节点
 */
export async function upsertNode(node: TreeNode, markDirty = true): Promise<void> {
  const localNode: LocalNode = {
    ...node,
    _dirty: markDirty,
    _pendingSync: false
  }
  await db.nodes.put(localNode)
}

/**
 * 批量插入或更新节点
 */
export async function upsertNodes(nodes: TreeNode[], markDirty = false): Promise<void> {
  const localNodes: LocalNode[] = nodes.map(node => ({
    ...node,
    _dirty: markDirty,
    _pendingSync: false
  }))
  await db.nodes.bulkPut(localNodes)
}

/**
 * 更新节点部分字段
 */
export async function updateNode(
  id: string, 
  updates: Partial<TreeNode>,
  markDirty = true
): Promise<void> {
  const now = Date.now()
  await db.nodes.update(id, {
    ...updates,
    updatedAt: now,
    version: (await db.nodes.get(id))?.version ?? 0 + 1,
    _dirty: markDirty ? 1 : undefined
  } as Partial<LocalNode>)
}

/**
 * 软删除节点
 */
export async function deleteNode(id: string): Promise<void> {
  const now = Date.now()
  await db.nodes.update(id, {
    deletedAt: now,
    updatedAt: now,
    _dirty: true
  } as Partial<LocalNode>)
}

/**
 * 硬删除节点
 */
export async function removeNode(id: string): Promise<void> {
  await db.nodes.delete(id)
}

/**
 * 标记节点为正在同步
 */
export async function markPendingSync(ids: string[]): Promise<void> {
  await db.nodes.where('id').anyOf(ids).modify({ _pendingSync: true })
}

/**
 * 清除脏标记
 */
export async function clearDirty(ids: string[]): Promise<void> {
  await db.nodes.where('id').anyOf(ids).modify({ 
    _dirty: false, 
    _pendingSync: false 
  })
}

/**
 * 清空所有节点
 */
export async function clearAllNodes(): Promise<void> {
  await db.nodes.clear()
}

// ===================
// 元数据操作
// ===================

/**
 * 获取元数据
 */
export async function getMetaValue<T>(key: string): Promise<T | undefined> {
  const record = await db.meta.get(key)
  return record?.value as T | undefined
}

/**
 * 设置元数据
 */
export async function setMetaValue<T>(key: string, value: T): Promise<void> {
  await db.meta.put({ key, value })
}

/**
 * 删除元数据
 */
export async function deleteMetaValue(key: string): Promise<void> {
  await db.meta.delete(key)
}

/**
 * 获取最后同步时间
 */
export async function getLastSyncTime(): Promise<number> {
  return (await getMetaValue<number>(META_KEYS.LAST_SYNC_TIME)) ?? 0
}

/**
 * 设置最后同步时间
 */
export async function setLastSyncTime(time: number): Promise<void> {
  await setMetaValue(META_KEYS.LAST_SYNC_TIME, time)
}

/**
 * 清空所有数据（登出时使用）
 */
export async function clearAllData(): Promise<void> {
  await db.nodes.clear()
  await db.meta.clear()
}
