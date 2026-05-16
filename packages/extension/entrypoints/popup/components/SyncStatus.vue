<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSyncStore } from '@/stores/sync'

const { t } = useI18n()
const syncStore = useSyncStore()
const dismissed = ref(false)

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

const showError = computed(() => {
  return syncStore.status === 'error' && syncStore.lastError && !dismissed.value
})

const briefErrorMessage = computed(() => {
  const err = syncStore.lastError
  if (!err) return ''
  if (err.includes('not_authenticated')) return t('sync.notAuthenticated')
  if (err.includes('NetworkError') || err.includes('fetch')) return t('sync.networkError')
  if (err.length > 60) return err.slice(0, 60) + '…'
  return err
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
    dismissed.value = false
    syncStore.sync()
  }
}

function handleRetry() {
  dismissed.value = false
  syncStore.sync()
}

function handleDismiss() {
  dismissed.value = true
}
</script>

<template>
  <div class="sync-wrapper">
    <div
      class="sync-status"
      :class="{ 'sync-status--error': syncStore.status === 'error' }"
      :title="syncStore.lastError || `${t('sync.clickToSync')}: ${lastSyncTimeDisplay}`"
      @click="handleClick"
    >
      <span class="sync-icon">{{ statusDisplay.icon }}</span>
    </div>
    <div v-if="showError" class="sync-error-banner">
      <span class="sync-error-text">{{ briefErrorMessage }}</span>
      <button class="sync-error-btn" @click="handleRetry">{{ t('sync.retry') }}</button>
      <button class="sync-error-dismiss" @click="handleDismiss" :title="t('sync.dismiss')">✕</button>
    </div>
  </div>
</template>

<style scoped>
.sync-wrapper {
  position: relative;
}

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

.sync-status--error {
  background: rgba(239, 68, 68, 0.1);
  border-radius: 4px;
}

.sync-icon {
  font-size: 14px;
}

.sync-error-banner {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--color-danger, #ef4444);
  color: #fff;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sync-error-text {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sync-error-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.sync-error-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sync-error-dismiss {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.sync-error-dismiss:hover {
  color: #fff;
}
</style>
