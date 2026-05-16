<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSyncStore } from '@/stores/sync'
import { RefreshCw, CheckCircle, AlertCircle, Circle } from 'lucide-vue-next'

const { t } = useI18n()
const syncStore = useSyncStore()

// 同步状态
const status = computed(() => syncStore.status)
const pendingCount = computed(() => syncStore.pendingCount)
const lastSyncTime = computed(() => syncStore.lastSyncTime)

// 状态文字
const statusText = computed(() => {
  switch (status.value) {
    case 'syncing': return t('sync.syncing')
    case 'success': return t('sync.synced')
    case 'error': return t('sync.error')
    default:
      if (pendingCount.value > 0) {
        return t('sync.pendingSync', { count: pendingCount.value })
      }
      return lastSyncTime.value 
        ? formatTime(lastSyncTime.value) 
        : t('sync.notSynced')
  }
})

// 格式化时间
function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return t('sync.justNow')
  if (diff < 3600000) return t('sync.minutesAgo', { n: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('sync.hoursAgo', { n: Math.floor(diff / 3600000) })
  
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 手动同步
function handleSync() {
  if (status.value !== 'syncing') {
    syncStore.sync()
  }
}
</script>

<template>
  <button
    class="sync-status"
    :class="status"
    :aria-label="`${t('sync.label')}: ${statusText}`"
    :title="status === 'syncing' ? t('sync.syncingTitle') : t('sync.clickToSync')"
    @click="handleSync"
  >
    <RefreshCw v-if="status === 'syncing'" :size="13" class="sync-icon animate-spin" />
    <CheckCircle v-else-if="status === 'success'" :size="13" class="sync-icon" />
    <AlertCircle v-else-if="status === 'error'" :size="13" class="sync-icon" />
    <Circle v-else :size="8" class="sync-dot" :class="{ active: pendingCount > 0 }" fill="currentColor" />
    <span class="sync-text">{{ statusText }}</span>
    <span v-if="pendingCount > 0 && status !== 'syncing'" class="pending-badge">
      {{ pendingCount }}
    </span>
  </button>
</template>

<style scoped>
.sync-status {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--duration-fast) ease;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.sync-status:hover {
  background: var(--bg-quaternary);
}

.sync-status:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.sync-status.syncing {
  background: var(--color-info-bg);
  color: var(--color-accent);
}

.sync-status.success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.sync-status.error {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.sync-icon {
  flex-shrink: 0;
}

.sync-dot {
  color: var(--text-quaternary);
}

.sync-dot.active {
  color: var(--color-accent);
}

.sync-text {
  font-weight: var(--font-weight-medium);
}

.pending-badge {
  background: var(--color-accent);
  color: var(--text-on-accent);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  padding: 1px 5px;
  border-radius: var(--radius-full);
  min-width: 16px;
  text-align: center;
  line-height: 1.3;
}
</style>
