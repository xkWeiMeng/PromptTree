import { post, get } from './client'
import type { SyncChange, TreeNode } from '@prompttree/shared'

export interface SyncRequest {
  lastSyncTime: number
  changes: SyncChange[]
}

export interface SyncResponse {
  success: boolean
  serverTime: number
  changes: SyncChange[]
  conflicts?: SyncChange[]
}

export interface FullSyncResponse {
  success: boolean
  serverTime: number
  nodes: TreeNode[]
}

/**
 * 增量同步
 */
export async function sync(request: SyncRequest): Promise<SyncResponse> {
  return post<SyncResponse>('/sync', request)
}

/**
 * 全量同步
 */
export async function fullSync(): Promise<FullSyncResponse> {
  return get<FullSyncResponse>('/sync/full')
}
