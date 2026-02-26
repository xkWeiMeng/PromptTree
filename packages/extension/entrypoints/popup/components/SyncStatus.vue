<script setup lang="ts">
import { computed } from 'vue'
import { useSyncStore } from '@/stores/sync'

const syncStore = useSyncStore()

const statusDisplay = computed(() => {
  switch (syncStore.status) {
    case 'syncing': return { icon: '🔄', text: '同步中...' }
    case 'success': return { icon: '✅', text: '已同步' }
    case 'error': return { icon: '❌', text: '同步失败' }
    default: {
      if (syncStore.pendingCount > 0) {
        return { icon: '📤', text: `${syncStore.pendingCount} 待同步` }
      }
      return { icon: '☁️', text: '已同步' }
    }
  }
})

const lastSyncTimeDisplay = computed(() => {
  if (!syncStore.lastSyncTime) return ''
  const diff = Date.now() - syncStore.lastSyncTime
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${Math.floor(diff / 86400000)} 天前`
})

function handleClick() {
  if (syncStore.status !== 'syncing') {
    syncStore.sync()
  }
}
</script>

<template>
  <div
    class="sync-status"
    :title="syncStore.lastError || `上次同步: ${lastSyncTimeDisplay}`"
    @click="handleClick"
  >
    <span class="sync-icon">{{ statusDisplay.icon }}</span>
  </div>
</template>

<style scoped>
.sync-status {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 2px;
  border-radius: 4px;
}

.sync-status:hover {
  background: var(--color-hover, #f3f4f6);
}

.sync-icon {
  font-size: 14px;
}
</style>
