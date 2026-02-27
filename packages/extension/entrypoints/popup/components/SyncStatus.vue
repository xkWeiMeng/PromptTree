<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSyncStore } from '@/stores/sync'

const { t } = useI18n()
const syncStore = useSyncStore()

const statusDisplay = computed(() => {
  switch (syncStore.status) {
    case 'syncing': return { icon: '🔄', text: t('sync.syncing') }
    case 'success': return { icon: '✅', text: t('sync.synced') }
    case 'error': return { icon: '❌', text: t('sync.error') }
    default: {
      if (syncStore.pendingCount > 0) {
        return { icon: '📤', text: t('sync.pendingSync', { count: syncStore.pendingCount }) }
      }
      return { icon: '☁️', text: t('sync.synced') }
    }
  }
})

const lastSyncTimeDisplay = computed(() => {
  if (!syncStore.lastSyncTime) return ''
  const diff = Date.now() - syncStore.lastSyncTime
  if (diff < 60000) return t('sync.justNow')
  if (diff < 3600000) return t('sync.minutesAgo', { n: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('sync.hoursAgo', { n: Math.floor(diff / 3600000) })
  return `${Math.floor(diff / 86400000)}d ago`
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
    :title="syncStore.lastError || `${t('sync.clickToSync')}: ${lastSyncTimeDisplay}`"
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
