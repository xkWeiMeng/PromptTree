import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SyncChange } from '@prompttree/shared'
import { createApiClient, processSyncResponse } from '@prompttree/shared'
import * as storage from '@/utils/storage'
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
  // API Client
  // ===================
  let _apiBaseUrl = 'http://localhost:3000'

  function getApiClient() {
    const authStore = useAuthStore()
    return createApiClient({
      baseUrl: _apiBaseUrl,
      getToken: () => authStore.accessToken,
      onUnauthorized: () => {
        authStore.logout()
      },
    })
  }

  // ===================
  // Actions
  // ===================

  /** 初始化 */
  async function init() {
    _apiBaseUrl = await storage.getApiBaseUrl()
    lastSyncTime.value = await storage.getLastSyncTime()
    await updatePendingCount()
  }

  /** 更新待同步数量 */
  async function updatePendingCount() {
    const dirtyNodes = await storage.getDirtyNodes()
    pendingCount.value = dirtyNodes.length
  }

  /** 触发同步（防抖） */
  function triggerSync() {
    if (syncTimer) {
      clearTimeout(syncTimer)
    }
    syncTimer = setTimeout(() => {
      sync()
    }, SYNC_DEBOUNCE_MS)
  }

  /** 立即同步 */
  async function sync(): Promise<boolean> {
    const authStore = useAuthStore()
    const treeStore = useTreeStore()

    if (!authStore.isLoggedIn) return false
    if (status.value === 'syncing') return false

    status.value = 'syncing'
    lastError.value = null

    try {
      const dirtyNodes = await storage.getDirtyNodes()

      const changes: SyncChange[] = dirtyNodes.map(node => ({
        id: node.id,
        action: node.deletedAt ? 'delete' : 'upsert',
        data: node,
      }))

      // 标记为正在同步
      await storage.markPendingSync(dirtyNodes.map(n => n.id))

      // 发送同步请求
      const api = getApiClient()
      const result = await api.sync({
        lastSyncTime: lastSyncTime.value,
        changes,
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Sync failed')
      }

      // 清除脏标记
      await storage.clearDirty(dirtyNodes.map(n => n.id))

      // 合并服务端变更
      const { nodes: mergedNodes, newSyncTime } = processSyncResponse(
        treeStore.nodes,
        result.data
      )

      await treeStore.setNodes(mergedNodes)

      // 更新同步时间
      lastSyncTime.value = newSyncTime
      await storage.setLastSyncTime(newSyncTime)

      await updatePendingCount()

      status.value = 'success'
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

      // 恢复脏标记（同步失败时）
      try {
        const stillDirty = await storage.getDirtyNodes()
        const pendingIds = stillDirty.filter(n => n._pendingSync).map(n => n.id)
        if (pendingIds.length > 0) {
          // 重新标记为 dirty（清除 pendingSync 状态）
          const allNodes = await storage.getNodes()
          for (const node of allNodes) {
            if (pendingIds.includes(node.id)) {
              node._dirty = true
              node._pendingSync = false
            }
          }
          await storage.setNodes(allNodes)
        }
      } catch {
        // 恢复脏标记失败，忽略
      }

      return false
    }
  }

  /** 全量同步 */
  async function fullSync(): Promise<boolean> {
    const authStore = useAuthStore()
    const treeStore = useTreeStore()

    if (!authStore.isLoggedIn) return false

    status.value = 'syncing'
    lastError.value = null

    try {
      const api = getApiClient()
      const result = await api.fullSync()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Full sync failed')
      }

      // 清空并重新加载
      await treeStore.clearNodes()

      const { nodes: mergedNodes, newSyncTime } = processSyncResponse(
        [],
        result.data
      )

      await treeStore.setNodes(mergedNodes)

      lastSyncTime.value = newSyncTime
      await storage.setLastSyncTime(newSyncTime)

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

  /** 重置状态 */
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
    updatePendingCount,
  }
})
