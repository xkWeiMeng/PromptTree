<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Copy, Share2, Users, Trash2, Loader2, LogIn } from 'lucide-vue-next'
import { createShare, deleteShare, getMyShare, type ShareInfo, type ShareStats } from '@/api/share'
import { useAuthStore } from '@/stores/auth'
import { useTreeStore } from '@/stores/tree'
import { useToast, useLoginModal } from '@/composables'
import { getShareEligibility } from '@/utils/share'

const props = defineProps<{
  visible: boolean
  nodeId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const toast = useToast()
const loginModal = useLoginModal()
const authStore = useAuthStore()
const treeStore = useTreeStore()

const modalRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const operating = ref(false)
const shareInfo = ref<ShareInfo | null>(null)
const shareStats = ref<ShareStats>({ readerCount: 0, readCount: 0 })
const errorMessage = ref('')
const expirationOption = ref<'never' | '1day' | '7days' | '30days'>('never')

const currentNode = computed(() => {
  if (!props.nodeId) return null
  return treeStore.nodes.find((node) => node.id === props.nodeId && node.deletedAt === null) || null
})

const eligibility = computed(() => {
  if (!props.nodeId) {
    return { allowed: false, reason: 'nodeNotFound' as const }
  }

  return getShareEligibility(props.nodeId, treeStore.nodes, {
    isLoggedIn: authStore.isLoggedIn,
    isOfflineMode: authStore.isOfflineMode
  })
})

const blockedMessage = computed(() => {
  switch (eligibility.value.reason) {
    case 'notLoggedIn':
      return t('share.mustLogin')
    case 'offlineMode':
      return t('share.offlineModeBlocked')
    case 'nodeDirty':
      return t('share.nodeNotSynced')
    case 'descendantDirty':
      return t('share.folderHasPendingChanges')
    default:
      return t('share.nodeUnavailable')
  }
})

function closeModal() {
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if ((event.target as HTMLElement).classList.contains('share-backdrop')) {
    closeModal()
  }
}

// 焦点陷阱
function trapFocus(e: KeyboardEvent) {
  const focusable = modalRef.value?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  if (!focusable?.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

async function loadShareState() {
  if (!props.visible || !props.nodeId) return

  shareInfo.value = null
  shareStats.value = { readerCount: 0, readCount: 0 }
  errorMessage.value = ''

  if (!eligibility.value.allowed) {
    return
  }

  loading.value = true
  try {
    const response = await getMyShare(props.nodeId)
    shareInfo.value = response.share
    shareStats.value = response.stats
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('share.loadFailed')
  } finally {
    loading.value = false
  }
}

async function handleCreateShare() {
  if (!props.nodeId) return

  if (!eligibility.value.allowed) {
    if (eligibility.value.reason === 'notLoggedIn') {
      loginModal.open()
    }
    toast.warning(blockedMessage.value)
    return
  }

  operating.value = true
  errorMessage.value = ''
  try {
    const expiresAt = getExpirationDate()
    const response = await createShare(props.nodeId, expiresAt ? { expiresAt } : undefined)
    shareInfo.value = response.share
    shareStats.value = response.stats
    toast.success(t('share.created'))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('share.createFailed')
  } finally {
    operating.value = false
  }
}

function getExpirationDate(): string | undefined {
  const now = Date.now()
  switch (expirationOption.value) {
    case '1day': return new Date(now + 86400000).toISOString()
    case '7days': return new Date(now + 7 * 86400000).toISOString()
    case '30days': return new Date(now + 30 * 86400000).toISOString()
    default: return undefined
  }
}

function getExpirationDisplay(): string {
  if (!shareInfo.value) return ''
  const info = shareInfo.value as ShareInfo & { expiresAt?: string }
  if (!info.expiresAt) return ''
  const expires = new Date(info.expiresAt).getTime()
  const now = Date.now()
  if (expires <= now) return t('share.expired')
  const diff = expires - now
  const days = Math.ceil(diff / 86400000)
  return t('share.expiresIn', { time: `${days}d` })
}

async function handleCopyLink() {
  if (!shareInfo.value) return

  try {
    await navigator.clipboard.writeText(shareInfo.value.link)
    toast.success(t('share.linkCopied'))
  } catch {
    toast.error(t('share.copyFailed'))
  }
}

async function handleDisableShare() {
  if (!shareInfo.value) return

  operating.value = true
  errorMessage.value = ''
  try {
    await deleteShare(shareInfo.value.id)
    shareInfo.value = null
    shareStats.value = { readerCount: 0, readCount: 0 }
    toast.success(t('share.revoked'))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('share.revokeFailed')
  } finally {
    operating.value = false
  }
}

watch(
  () => [props.visible, props.nodeId, treeStore.nodes.length],
  () => {
    if (props.visible) {
      loadShareState()
    }
  },
  { immediate: true }
)

// 打开时聚焦第一个可交互元素
watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick()
    const first = modalRef.value?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    first?.focus()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="visible" class="share-backdrop" @click="handleBackdropClick">
        <Transition name="modal" appear>
          <div
            v-if="visible"
            ref="modalRef"
            class="share-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Share"
            @keydown.tab="trapFocus"
            @keydown.escape="closeModal"
          >
            <div class="share-header">
              <h3>{{ t('share.title') }}</h3>
              <p class="sub-title">{{ currentNode?.title || t('common.untitled') }}</p>
            </div>

            <div v-if="loading" class="loading">
              <Loader2 :size="16" class="animate-spin" />
              <span>{{ t('share.loading') }}</span>
            </div>

            <template v-else>
              <div v-if="!eligibility.allowed" class="blocked">
                <p>{{ blockedMessage }}</p>
                <button
                  v-if="eligibility.reason === 'notLoggedIn'"
                  class="btn-primary"
                  @click="loginModal.open()"
                >
                  <LogIn :size="14" />
                  {{ t('share.goLogin') }}
                </button>
              </div>

              <div v-else-if="shareInfo" class="share-body">
                <label class="label">{{ t('share.linkLabel') }}</label>
                <div class="link-row">
                  <input :value="shareInfo.link" readonly class="link-input" :aria-label="t('share.linkLabel')" />
                  <button class="icon-btn" @click="handleCopyLink" :title="t('share.copyLink')" :aria-label="t('share.copyLink')">
                    <Copy :size="14" />
                  </button>
                </div>

                <div class="stats">
                  <span class="stat-item">
                    <Users :size="14" />
                    {{ t('share.readerCount', { count: shareStats.readerCount }) }}
                  </span>
                  <span v-if="getExpirationDisplay()" class="stat-item stat-expiry">
                    {{ getExpirationDisplay() }}
                  </span>
                </div>

                <div class="actions">
                  <button class="btn-secondary" :disabled="operating" @click="closeModal">
                    {{ t('common.close') }}
                  </button>
                  <button class="btn-danger" :disabled="operating" @click="handleDisableShare">
                    <Trash2 :size="14" />
                    {{ t('share.revoke') }}
                  </button>
                </div>
              </div>

              <div v-else class="share-body">
                <p class="hint">{{ t('share.description') }}</p>
                <div class="expiration-picker">
                  <label class="label">{{ t('share.expiration') }}</label>
                  <select v-model="expirationOption" class="expiration-select">
                    <option value="never">{{ t('share.expiresNever') }}</option>
                    <option value="1day">{{ t('share.expires1Day') }}</option>
                    <option value="7days">{{ t('share.expires7Days') }}</option>
                    <option value="30days">{{ t('share.expires30Days') }}</option>
                  </select>
                </div>
                <div class="actions">
                  <button class="btn-secondary" :disabled="operating" @click="closeModal">
                    {{ t('common.close') }}
                  </button>
                  <button class="btn-primary" :disabled="operating" @click="handleCreateShare">
                    <Share2 :size="14" />
                    {{ t('share.create') }}
                  </button>
                </div>
              </div>

              <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
            </template>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.share-backdrop {
  position: fixed;
  inset: 0;
  background: var(--glass-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  overscroll-behavior: contain;
}

.share-dialog {
  width: 100%;
  max-width: 420px;
  margin: var(--space-5);
  border-radius: var(--radius-modal);
  border: 0.5px solid var(--border-secondary);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

@supports (backdrop-filter: blur(1px)) {
  .share-dialog {
    background: var(--glass-bg-thick);
    backdrop-filter: blur(var(--glass-blur-heavy));
    -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  }
}

.share-header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 0.5px solid var(--border-secondary);
}

.share-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.sub-title {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.share-body {
  padding: var(--space-4) var(--space-5);
}

.label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.link-row {
  margin-top: var(--space-2);
  display: flex;
  gap: var(--space-2);
}

.link-input {
  flex: 1;
  border: 0.5px solid var(--border-secondary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  font-size: var(--font-size-sm);
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  border: 0.5px solid var(--border-secondary);
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.stats {
  margin-top: var(--space-3);
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.stat-expiry {
  margin-left: var(--space-3);
  color: var(--text-warning);
}

.expiration-picker {
  margin: var(--space-3) 0;
}

.expiration-select {
  margin-top: var(--space-1);
  width: 100%;
  padding: var(--space-2);
  border: 0.5px solid var(--border-secondary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  outline: none;
}

.expiration-select:focus {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.actions {
  margin-top: var(--space-4);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.btn-primary,
.btn-secondary,
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  padding: var(--space-2) var(--space-3);
  border: 0.5px solid transparent;
}

.btn-primary {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-secondary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.btn-danger:hover {
  background: var(--color-danger);
  color: var(--text-on-accent);
}

.hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.blocked {
  padding: var(--space-4) var(--space-5);
}

.blocked p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.blocked .btn-primary {
  margin-top: var(--space-3);
}

.error {
  margin: 0;
  padding: 0 var(--space-5) var(--space-4);
  color: var(--color-danger);
  font-size: var(--font-size-xs);
}

.loading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

@media (max-width: 480px) {
  .share-dialog {
    width: 100%;
    max-width: 100%;
    height: 100dvh;
    border-radius: 0;
    margin: 0;
  }
}
</style>
