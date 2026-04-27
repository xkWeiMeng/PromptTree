import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SyncChange, TreeNode } from '@prompttree/shared'
import * as dbOps from '@/db/operations'
import { handleUnauthorized } from '@/api/client'
import { useAuthStore } from './auth'
import { useTreeStore } from './tree'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export const useSyncStore = defineStore('sync', () => {
  // ===================
  // State
  // ===================
  const status = ref<SyncStatus>('idle')
  const lastSyncTime = ref(0)
  const lastError = ref<string | null>(null)
  const pendingCount = ref(0)

  // 防抖定时器
  let syncTimer: ReturnType<typeof setTimeout> | null = null
  const SYNC_DEBOUNCE_MS = 2000

  // ===================
  // Getters
  // ===================
  const isSyncing = computed(() => status.value === 'syncing')
  const hasPendingChanges = computed(() => pendingCount.value > 0)

  // ===================
  // Actions
  // ===================

  /**
   * 初始化（从本地恢复 lastSyncTime）
   */
  async function init() {
    lastSyncTime.value = await dbOps.getLastSyncTime()
    await updatePendingCount()
  }

  /**
   * 更新待同步数量
   */
  async function updatePendingCount() {
    const dirtyNodes = await dbOps.getDirtyNodes()
    pendingCount.value = dirtyNodes.length
  }

  /**
   * 触发同步（防抖）
   */
  function triggerSync() {
    if (syncTimer) {
      clearTimeout(syncTimer)
    }
    
    syncTimer = setTimeout(() => {
      sync()
    }, SYNC_DEBOUNCE_MS)
  }

  /**
   * 立即同步
   */
  async function sync(): Promise<boolean> {
    const authStore = useAuthStore()
    const treeStore = useTreeStore()
    
    if (!authStore.isLoggedIn) {
      return false
    }
    
    if (status.value === 'syncing') {
      return false
    }
    
    status.value = 'syncing'
    lastError.value = null
    
    try {
      // 获取脏数据
      const dirtyNodes = await dbOps.getDirtyNodes()
      
      // 构建变更列表
      const changes: SyncChange[] = dirtyNodes.map(node => ({
        id: node.id,
        action: node.deletedAt ? 'delete' : 'upsert',
        data: node
      }))
      
      // 标记为正在同步
      await dbOps.markPendingSync(dirtyNodes.map(n => n.id))
      
      // 发送同步请求
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.accessToken}`
        },
        body: JSON.stringify({
          lastSyncTime: lastSyncTime.value,
          changes
        })
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          await handleUnauthorized()
          return false
        }
        throw new Error(`Sync failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      // 清除脏标记
      await dbOps.clearDirty(dirtyNodes.map(n => n.id))
      
      // 合并服务端变更
      if (result.changes && result.changes.length > 0) {
        const serverNodes: TreeNode[] = result.changes
          .filter((c: SyncChange) => c.action === 'upsert' && c.data)
          .map((c: SyncChange) => c.data!)
        
        if (serverNodes.length > 0) {
          await treeStore.setNodes(serverNodes)
        }
      }
      
      // 更新同步时间
      lastSyncTime.value = result.serverTime
      await dbOps.setLastSyncTime(result.serverTime)
      
      // 更新待同步数量
      await updatePendingCount()
      
      status.value = 'success'
      
      // 3 秒后回到 idle
      setTimeout(() => {
        if (status.value === 'success') {
          status.value = 'idle'
        }
      }, 3000)
      
      return true
    } catch (err) {
      console.error('Sync error:', err)
      lastError.value = err instanceof Error ? err.message : 'Unknown error'
      status.value = 'error'
      
      // 恢复脏标记（同步失败）
      const dirtyNodes = await dbOps.getDirtyNodes()
      await dbOps.clearDirty(dirtyNodes.map(n => n.id))
      
      return false
    }
  }

  /**
   * 全量同步
   */
  async function fullSync(): Promise<boolean> {
    const authStore = useAuthStore()
    const treeStore = useTreeStore()
    
    if (!authStore.isLoggedIn) {
      return false
    }
    
    status.value = 'syncing'
    lastError.value = null
    
    try {
      const response = await fetch('/api/sync/full', {
        headers: {
          'Authorization': `Bearer ${authStore.accessToken}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          await handleUnauthorized()
          return false
        }
        throw new Error(`Full sync failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      // 清空并重新加载
      await treeStore.clearNodes()
      await treeStore.setNodes(result.nodes)
      
      // 更新同步时间
      lastSyncTime.value = result.serverTime
      await dbOps.setLastSyncTime(result.serverTime)
      
      status.value = 'success'
      
      setTimeout(() => {
        if (status.value === 'success') {
          status.value = 'idle'
        }
      }, 3000)
      
      return true
    } catch (err) {
      console.error('Full sync error:', err)
      lastError.value = err instanceof Error ? err.message : 'Unknown error'
      status.value = 'error'
      return false
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    status.value = 'idle'
    lastSyncTime.value = 0
    lastError.value = null
    pendingCount.value = 0
    
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
  }

  return {
    // State
    status,
    lastSyncTime,
    lastError,
    pendingCount,
    // Getters
    isSyncing,
    hasPendingChanges,
    // Actions
    init,
    triggerSync,
    sync,
    fullSync,
    reset,
    updatePendingCount
  }
})
