/**
 * 存储封装
 * 使用 chrome.storage.local 实现离线优先的数据存储
 */

import type { TreeNode, User } from '@prompttree/shared'
import { getDescendantIds } from '@prompttree/shared'

// ========================================
// 类型定义
// ========================================

/** 本地节点（扩展 _dirty 和 _pendingSync 标记） */
export interface LocalNode extends TreeNode {
  _dirty: boolean
  _pendingSync: boolean
}

// ========================================
// Storage Keys
// ========================================

const STORAGE_KEY = 'prompttree_nodes'
const META_KEYS = {
  ACCESS_TOKEN: 'meta_accessToken',
  USER: 'meta_user',
  LAST_SYNC_TIME: 'meta_lastSyncTime',
  OFFLINE_MODE: 'meta_offlineMode',
  API_BASE_URL: 'meta_apiBaseUrl',
  THEME: 'meta_theme',
} as const

export type ThemeMode = 'system' | 'light' | 'dark'

// ========================================
// 节点操作
// ========================================

/** 获取所有节点 */
export async function getNodes(): Promise<LocalNode[]> {
  const result = await browser.storage.local.get(STORAGE_KEY)
  return result[STORAGE_KEY] || []
}

/** 获取活跃节点（未删除） */
export async function getActiveNodes(): Promise<LocalNode[]> {
  const nodes = await getNodes()
  return nodes.filter(n => n.deletedAt === null)
}

/** 覆盖写入所有节点 */
export async function setNodes(nodes: LocalNode[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: nodes })
}

/** 获取待同步（dirty）节点 */
export async function getDirtyNodes(): Promise<LocalNode[]> {
  const nodes = await getNodes()
  return nodes.filter(n => n._dirty)
}

/** 插入或更新单个节点 */
export async function upsertNode(node: TreeNode, dirty = true): Promise<void> {
  const nodes = await getNodes()
  const index = nodes.findIndex(n => n.id === node.id)

  const localNode: LocalNode = {
    ...node,
    _dirty: dirty,
    _pendingSync: false,
  }

  if (index >= 0) {
    nodes[index] = localNode
  } else {
    nodes.push(localNode)
  }

  await setNodes(nodes)
}

/** 批量插入或更新节点 */
export async function upsertNodes(newNodes: TreeNode[], dirty = false): Promise<void> {
  const nodes = await getNodes()
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  for (const node of newNodes) {
    nodeMap.set(node.id, {
      ...node,
      _dirty: dirty,
      _pendingSync: false,
    })
  }

  await setNodes(Array.from(nodeMap.values()))
}

/** 更新节点部分字段 */
export async function updateNode(id: string, updates: Partial<TreeNode>): Promise<void> {
  const nodes = await getNodes()
  const index = nodes.findIndex(n => n.id === id)
  if (index < 0) return

  const now = Date.now()
  nodes[index] = {
    ...nodes[index],
    ...updates,
    updatedAt: now,
    version: nodes[index].version + 1,
    _dirty: true,
  }

  await setNodes(nodes)
}

/** 软删除节点（递归删除子节点） */
export async function deleteNode(id: string): Promise<void> {
  const nodes = await getNodes()
  const now = Date.now()

  // 收集所有要删除的 ID
  const idsToDelete = [id, ...getDescendantIds(nodes, id)]

  for (const nodeId of idsToDelete) {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      node.deletedAt = now
      node.updatedAt = now
      node._dirty = true
    }
  }

  await setNodes(nodes)
}

/** 标记节点为正在同步 */
export async function markPendingSync(ids: string[]): Promise<void> {
  const nodes = await getNodes()
  const idSet = new Set(ids)

  for (const node of nodes) {
    if (idSet.has(node.id)) {
      node._pendingSync = true
    }
  }

  await setNodes(nodes)
}

/** 清除 dirty 标记（同步成功后） */
export async function clearDirty(ids: string[]): Promise<void> {
  const nodes = await getNodes()
  const idSet = new Set(ids)

  for (const node of nodes) {
    if (idSet.has(node.id)) {
      node._dirty = false
      node._pendingSync = false
    }
  }

  await setNodes(nodes)
}

/** 清空所有节点 */
export async function clearAllNodes(): Promise<void> {
  await browser.storage.local.remove(STORAGE_KEY)
}

// ========================================
// Meta 存取（token、用户、同步时间等）
// ========================================

async function getMetaValue<T>(key: string): Promise<T | null> {
  const result = await browser.storage.local.get(key)
  return (result[key] as T) ?? null
}

async function setMetaValue<T>(key: string, value: T): Promise<void> {
  await browser.storage.local.set({ [key]: value })
}

// --- Access Token ---
export async function getAccessToken(): Promise<string | null> {
  return getMetaValue<string>(META_KEYS.ACCESS_TOKEN)
}

export async function setAccessToken(token: string): Promise<void> {
  await setMetaValue(META_KEYS.ACCESS_TOKEN, token)
}

// --- User ---
export async function getUser(): Promise<User | null> {
  return getMetaValue<User>(META_KEYS.USER)
}

export async function setUser(user: User): Promise<void> {
  await setMetaValue(META_KEYS.USER, user)
}

// --- Last Sync Time ---
export async function getLastSyncTime(): Promise<number> {
  return (await getMetaValue<number>(META_KEYS.LAST_SYNC_TIME)) ?? 0
}

export async function setLastSyncTime(time: number): Promise<void> {
  await setMetaValue(META_KEYS.LAST_SYNC_TIME, time)
}

// --- Offline Mode ---
export async function getOfflineMode(): Promise<boolean> {
  return (await getMetaValue<boolean>(META_KEYS.OFFLINE_MODE)) ?? false
}

export async function setOfflineMode(value: boolean): Promise<void> {
  await setMetaValue(META_KEYS.OFFLINE_MODE, value)
}

// --- API Base URL ---
export async function getApiBaseUrl(): Promise<string> {
  return (await getMetaValue<string>(META_KEYS.API_BASE_URL)) ?? 'http://localhost:3000'
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await setMetaValue(META_KEYS.API_BASE_URL, url)
}

// --- Theme ---
export async function getTheme(): Promise<ThemeMode> {
  return (await getMetaValue<ThemeMode>(META_KEYS.THEME)) ?? 'system'
}

export async function setTheme(theme: ThemeMode): Promise<void> {
  await setMetaValue(META_KEYS.THEME, theme)
}

// --- 清除所有数据 ---
export async function clearAllData(): Promise<void> {
  await browser.storage.local.clear()
}
