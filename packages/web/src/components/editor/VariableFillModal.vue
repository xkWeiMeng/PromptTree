<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Copy, Check } from 'lucide-vue-next'

const { t } = useI18n()

const VAR_DEFAULTS_KEY = 'prompttree-var-defaults'

const props = defineProps<{
  visible: boolean
  variables: string[]
  content: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'copy', filledContent: string): void
}>()

const modalRef = ref<HTMLElement | null>(null)

// 变量值映射
const variableValues = ref<Record<string, string>>({})
const saveDefaults = ref<Record<string, boolean>>({})

// Load saved defaults
function loadDefaults(): Record<string, string> {
  try {
    const raw = localStorage.getItem(VAR_DEFAULTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveDefaultValues() {
  const defaults = loadDefaults()
  for (const [key, shouldSave] of Object.entries(saveDefaults.value)) {
    if (shouldSave && variableValues.value[key]) {
      defaults[key] = variableValues.value[key]
    }
  }
  localStorage.setItem(VAR_DEFAULTS_KEY, JSON.stringify(defaults))
}

// 初始化变量值
watch(() => props.variables, (vars) => {
  const defaults = loadDefaults()
  const newValues: Record<string, string> = {}
  const newSaveFlags: Record<string, boolean> = {}
  for (const v of vars) {
    newValues[v] = variableValues.value[v] || defaults[v] || ''
    newSaveFlags[v] = !!defaults[v]
  }
  variableValues.value = newValues
  saveDefaults.value = newSaveFlags
}, { immediate: true })

// 预览内容
const previewContent = computed(() => {
  let result = props.content
  for (const [key, value] of Object.entries(variableValues.value)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    result = result.replace(regex, value || `{{${key}}}`)
  }
  return result
})

// 所有变量是否已填写
const allFilled = computed(() => {
  return props.variables.every(v => variableValues.value[v]?.trim())
})

// 复制按钮成功动画
const copySuccess = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

// 复制并关闭
async function handleCopy() {
  try {
    saveDefaultValues()
    await navigator.clipboard.writeText(previewContent.value)
    copySuccess.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copySuccess.value = false
      emit('copy', previewContent.value)
      emit('close')
    }, 1200)
  } catch (e) {
    console.error('复制失败:', e)
  }
}

// 关闭弹窗
function handleClose() {
  emit('close')
}

// 点击背景关闭
function handleBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
    handleClose()
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
      <div v-if="visible" class="modal-backdrop" @click="handleBackdropClick">
        <Transition name="modal" appear>
          <div
            v-if="visible"
            ref="modalRef"
            class="modal"
            role="dialog"
            aria-modal="true"
            @keydown.tab="trapFocus"
            @keydown.escape="handleClose"
          >
            <div class="modal-header">
              <h3>{{ t('variableModal.fillTitle') }}</h3>
              <button class="icon-btn close" @click="handleClose" :aria-label="t('common.close')">
                <X :size="16" />
              </button>
            </div>
            
            <div class="modal-body">
              <!-- 变量输入 -->
              <div class="variables-form">
                <div v-for="v in variables" :key="v" class="form-item">
                  <label>{{ v }}</label>
                  <input
                    v-model="variableValues[v]"
                    type="text"
                    :placeholder="t('variableModal.inputPlaceholder', { name: v })"
                  />
                  <label class="save-default-label">
                    <input type="checkbox" v-model="saveDefaults[v]" />
                    <span>{{ t('variableModal.saveAsDefault') }}</span>
                  </label>
                </div>
              </div>
              
              <!-- 预览 -->
              <div class="preview-section">
                <h4>{{ t('variableModal.preview') }}</h4>
                <div class="preview-content">
                  {{ previewContent }}
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <button class="btn-cancel" @click="handleClose">{{ t('common.cancel') }}</button>
              <button 
                class="btn-copy" 
                :class="{ 'copy-success': copySuccess }"
                @click="handleCopy"
              >
                <Check v-if="copySuccess" :size="14" />
                <Copy v-else :size="14" />
                {{ copySuccess ? t('editor.saved') : t('variableModal.copyToClipboard') }}
              </button>
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--glass-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  overscroll-behavior: contain;
}

.modal {
  background: var(--bg-elevated);
  border-radius: var(--radius-modal);
  width: 90%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
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

/* ===================
   Header
   =================== */
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

/* ===================
   Body
   =================== */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.variables-form {
  margin-bottom: var(--space-5);
}

.form-item {
  margin-bottom: var(--space-4);
}

.form-item label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.form-item input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  transition: border-color var(--duration-fast) ease,
              box-shadow var(--duration-fast) ease;
}

.form-item input[type="text"]:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.save-default-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
  font-size: var(--font-size-xs) !important;
  color: var(--text-tertiary) !important;
  font-weight: var(--font-weight-normal) !important;
  font-family: inherit !important;
  cursor: pointer;
}

.save-default-label input[type="checkbox"] {
  width: auto;
  accent-color: var(--color-accent);
}

.preview-section h4 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.preview-content {
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  border: 0.5px solid var(--border-secondary);
}

/* ===================
   Footer
   =================== */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border-top: 0.5px solid var(--border-secondary);
}

.btn-cancel {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: background var(--duration-fast) ease;
}

.btn-cancel:hover {
  background: var(--bg-quaternary);
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: background var(--duration-fast) ease;
}

.btn-copy:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.btn-copy.copy-success {
  background: var(--color-success);
}

.btn-copy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .modal {
    width: 100%;
    max-width: 100%;
    height: 100dvh;
    border-radius: 0;
  }

  .form-item input {
    padding: var(--space-3) var(--space-4);
  }
}
</style>
