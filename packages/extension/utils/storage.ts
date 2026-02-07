/**
 * 存储封装
 */

import type { TreeNode } from '@prompttree/shared'

const STORAGE_KEY = 'prompttree_data'

export async function getNodes(): Promise<TreeNode[]> {
  const result = await browser.storage.local.get(STORAGE_KEY)
  return result[STORAGE_KEY] || []
}

export async function setNodes(nodes: TreeNode[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: nodes })
}

export async function getLastSyncTime(): Promise<number> {
  const result = await browser.storage.local.get('lastSyncTime')
  return result.lastSyncTime || 0
}

export async function setLastSyncTime(time: number): Promise<void> {
  await browser.storage.local.set({ lastSyncTime: time })
}
