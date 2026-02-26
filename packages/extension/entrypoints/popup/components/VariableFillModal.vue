<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { extractVariables, fillVariables } from '@prompttree/shared'

const props = defineProps<{
  visible: boolean
  variables: string[]
  content: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'inject', filledContent: string): void
  (e: 'copy', filledContent: string): void
}>()

const variableValues = ref<Record<string, string>>({})

watch(() => props.variables, (vars) => {
  const newValues: Record<string, string> = {}
  for (const v of vars) {
    newValues[v] = variableValues.value[v] || ''
  }
  variableValues.value = newValues
}, { immediate: true })

const previewContent = computed(() => {
  return fillVariables(props.content, variableValues.value)
})

const allFilled = computed(() => {
  return props.variables.every(v => variableValues.value[v]?.trim())
})

function handleInject() {
  emit('inject', previewContent.value)
  emit('close')
}

function handleCopy() {
  emit('copy', previewContent.value)
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>填充变量</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="variables-form">
          <div v-for="v in variables" :key="v" class="form-item">
            <label>{{ v }}</label>
            <input
              v-model="variableValues[v]"
              type="text"
              :placeholder="`输入 ${v} 的值...`"
            />
          </div>
        </div>

        <div class="preview-section">
          <h4>预览</h4>
          <div class="preview-content">{{ previewContent }}</div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn--secondary" @click="$emit('close')">取消</button>
        <button class="btn btn--secondary" :disabled="!allFilled" @click="handleCopy">复制</button>
        <button class="btn btn--primary" :disabled="!allFilled" @click="handleInject">填入页面</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-bg, #fff);
  border-radius: 10px;
  width: 330px;
  max-height: 460px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.modal-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--color-text-secondary, #9ca3af);
}

.modal-body {
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
}

.form-item {
  margin-bottom: 10px;
}

.form-item label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 4px;
}

.form-item input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: var(--color-bg, #fff);
  color: var(--color-text, #1f2937);
}

.form-item input:focus {
  border-color: var(--color-primary, #4f46e5);
}

.preview-section {
  margin-top: 8px;
}

.preview-section h4 {
  font-size: 12px;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 4px;
}

.preview-content {
  font-size: 12px;
  padding: 8px;
  background: var(--color-hover, #f3f4f6);
  border-radius: 6px;
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text, #1f2937);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--color-primary, #4f46e5);
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--secondary {
  background: var(--color-bg, #fff);
  border-color: var(--color-border, #e5e7eb);
  color: var(--color-text, #1f2937);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--color-hover, #f3f4f6);
}
</style>
