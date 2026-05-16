<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Download, Upload, Loader2 } from 'lucide-vue-next'
import { useTreeStore } from '@/stores/tree'
import { useToast } from '@/composables'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const treeStore = useTreeStore()
const toast = useToast()

const importing = ref(false)
const importMode = ref<'merge' | 'replace'>('merge')
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleClose() {
  emit('close')
}

function handleBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
    handleClose()
  }
}

function handleExport() {
  const nodes = treeStore.nodes.filter(n => n.deletedAt === null)
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    nodes: nodes.map(n => ({
      id: n.id,
      parentId: n.parentId,
      type: n.type,
      title: n.title,
      content: n.content,
      isFavorite: n.isFavorite,
      sortOrder: n.sortOrder,
      collapsed: n.collapsed,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt
    }))
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `prompttree-export-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(t('exportImport.exportSuccess'))
}

function triggerImport() {
  fileInputRef.value?.click()
}

async function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  importing.value = true
  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.nodes || !Array.isArray(data.nodes)) {
      toast.error(t('exportImport.importFailed'))
      return
    }

    // Validate node structure
    for (const node of data.nodes) {
      if (!node.id || !node.type || !['folder', 'prompt'].includes(node.type)) {
        toast.error(t('exportImport.importFailed'))
        return
      }
    }

    if (importMode.value === 'replace') {
      // Delete all existing nodes first
      for (const node of treeStore.nodes) {
        if (node.deletedAt === null) {
          await treeStore.deleteNode(node.id)
        }
      }
    }

    // Import nodes
    let count = 0
    for (const node of data.nodes) {
      await treeStore.createNode({
        type: node.type,
        title: node.title || '',
        content: node.content || '',
        parentId: node.parentId || null
      })
      count++
    }

    toast.success(t('exportImport.importSuccess', { count }))
    handleClose()
  } catch {
    toast.error(t('exportImport.importFailed'))
  } finally {
    importing.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="visible" class="modal-backdrop" @click="handleBackdropClick">
        <Transition name="modal" appear>
          <div v-if="visible" class="modal" role="dialog" aria-modal="true" @keydown.escape="handleClose">
            <div class="modal-header">
              <h3>{{ t('exportImport.title') }}</h3>
              <button class="icon-btn close" @click="handleClose" :aria-label="t('common.close')">
                <X :size="16" />
              </button>
            </div>

            <div class="modal-body">
              <!-- Export -->
              <div class="section">
                <h4>{{ t('exportImport.exportTitle') }}</h4>
                <p class="section-desc">{{ t('exportImport.exportDesc') }}</p>
                <button class="action-btn action-btn--primary" @click="handleExport">
                  <Download :size="14" />
                  {{ t('exportImport.exportBtn') }}
                </button>
              </div>

              <div class="divider"></div>

              <!-- Import -->
              <div class="section">
                <h4>{{ t('exportImport.importTitle') }}</h4>
                <p class="section-desc">{{ t('exportImport.importDesc') }}</p>
                <div class="import-options">
                  <label class="radio-label">
                    <input type="radio" v-model="importMode" value="merge" />
                    {{ t('exportImport.mergeMode') }}
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="importMode" value="replace" />
                    {{ t('exportImport.replaceMode') }}
                  </label>
                </div>
                <button class="action-btn action-btn--secondary" :disabled="importing" @click="triggerImport">
                  <Loader2 v-if="importing" :size="14" class="animate-spin" />
                  <Upload v-else :size="14" />
                  {{ importing ? t('exportImport.importing') : t('exportImport.importBtn') }}
                </button>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".json"
                  class="file-input-hidden"
                  @change="handleFileChange"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--glass-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.modal {
  background: var(--bg-elevated);
  border-radius: var(--radius-modal);
  width: 90%;
  max-width: 460px;
  box-shadow: var(--shadow-xl);
  border: 0.5px solid var(--border-secondary);
}

@supports (backdrop-filter: blur(1px)) {
  .modal {
    background: var(--glass-bg-thick);
    backdrop-filter: blur(var(--glass-blur-heavy));
    -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 0.5px solid var(--border-secondary);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.icon-btn.close:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.modal-body {
  padding: var(--space-5);
}

.section h4 {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.section-desc {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.divider {
  height: 0.5px;
  background: var(--border-secondary);
  margin: var(--space-5) 0;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.radio-label input[type="radio"] {
  accent-color: var(--color-accent);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: none;
  transition: background var(--duration-fast) ease;
}

.action-btn--primary {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.action-btn--primary:hover {
  background: var(--color-accent-hover);
}

.action-btn--secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 0.5px solid var(--border-secondary);
}

.action-btn--secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-input-hidden {
  display: none;
}

@media (max-width: 480px) {
  .modal {
    width: 100%;
    max-width: 100%;
    height: 100dvh;
    border-radius: 0;
  }
}
</style>
