<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTreeStore } from '@/stores/tree'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  editNodeId?: string | null    // 编辑已有节点
  defaultType?: 'folder' | 'prompt'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const treeStore = useTreeStore()

const nodeType = ref<'folder' | 'prompt'>(props.defaultType ?? 'prompt')
const title = ref('')
const content = ref('')
const hasUnsavedChanges = ref(false)

// 如果是编辑模式，加载已有数据
if (props.editNodeId) {
  const node = treeStore.getNode(props.editNodeId)
  if (node) {
    nodeType.value = node.type
    title.value = node.title
    content.value = node.content
  }
}

// =================== Auto-save (edit mode only) ===================
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
const AUTO_SAVE_DEBOUNCE_MS = 500

function scheduleAutoSave() {
  if (!props.editNodeId) return
  hasUnsavedChanges.value = true
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    performAutoSave()
  }, AUTO_SAVE_DEBOUNCE_MS)
}

async function performAutoSave() {
  if (!props.editNodeId) return
  await treeStore.updateNode(props.editNodeId, {
    title: title.value,
    content: content.value,
  })
  hasUnsavedChanges.value = false
}

watch(title, () => scheduleAutoSave())
watch(content, () => scheduleAutoSave())

function handleBlur() {
  if (hasUnsavedChanges.value && props.editNodeId) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    performAutoSave()
  }
}

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (hasUnsavedChanges.value && props.editNodeId) {
    performAutoSave()
  }
})

async function handleSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (props.editNodeId) {
    // 编辑
    await treeStore.updateNode(props.editNodeId, {
      title: title.value,
      content: content.value,
    })
    hasUnsavedChanges.value = false
  } else {
    // 新建
    await treeStore.createNode({
      type: nodeType.value,
      title: title.value || (nodeType.value === 'folder' ? t('tree.newFolder') : t('tree.newPrompt')),
      content: content.value,
    })
  }
  emit('saved')
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="editor-panel">
    <div class="editor-header">
      <h3>{{ editNodeId ? t('editor.editTitle') : t('editor.newTitle') }}</h3>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="editor-body">
      <!-- 类型选择（仅新建） -->
      <div v-if="!editNodeId" class="form-item">
        <label>{{ t('editor.typePlaceholder') }}</label>
        <div class="type-switch">
          <button
            :class="['type-btn', { active: nodeType === 'folder' }]"
            @click="nodeType = 'folder'"
          >📁 {{ t('editor.typeFolder') }}</button>
          <button
            :class="['type-btn', { active: nodeType === 'prompt' }]"
            @click="nodeType = 'prompt'"
          >📄 {{ t('editor.typePrompt') }}</button>
        </div>
      </div>

      <!-- 标题 -->
      <div class="form-item">
        <label>{{ t('editor.titlePlaceholder') }}</label>
        <input
          v-model="title"
          type="text"
          :placeholder="nodeType === 'folder' ? t('editor.typeFolder') : t('editor.typePrompt')"
          @blur="handleBlur"
        />
      </div>

      <!-- 内容（仅 Prompt） -->
      <div v-if="nodeType === 'prompt'" class="form-item">
        <label>{{ t('editor.contentPlaceholder') }}</label>
        <textarea
          v-model="content"
          :placeholder="t('editor.contentPlaceholder')"
          rows="8"
          @blur="handleBlur"
        />
      </div>
    </div>

    <div class="editor-footer">
      <span v-if="editNodeId && hasUnsavedChanges" class="unsaved-indicator">{{ t('editor.unsavedChanges') }}</span>
      <button class="btn btn--secondary" @click="$emit('close')">{{ t('common.cancel') }}</button>
      <button class="btn btn--primary" @click="handleSave">{{ t('common.save') }}</button>
    </div>
  </div>
</template>

<style scoped>
.editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg, #fff);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.editor-header h3 {
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

.editor-body {
  flex: 1;
  padding: 12px 16px;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 12px;
}

.form-item label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 4px;
}

.form-item input,
.form-item textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  background: var(--color-bg, #fff);
  color: var(--color-text, #1f2937);
  resize: vertical;
}

.form-item input:focus,
.form-item textarea:focus {
  border-color: var(--color-primary, #4f46e5);
}

.type-switch {
  display: flex;
  gap: 8px;
}

.type-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: var(--color-bg, #fff);
  color: var(--color-text, #1f2937);
  transition: all 0.15s;
}

.type-btn.active {
  border-color: var(--color-primary, #4f46e5);
  background: var(--color-selected, #ede9fe);
  color: var(--color-primary, #4f46e5);
}

.editor-footer {
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

.btn--primary {
  background: var(--color-primary, #4f46e5);
  color: #fff;
}

.btn--primary:hover {
  opacity: 0.9;
}

.btn--secondary {
  background: var(--color-bg, #fff);
  border-color: var(--color-border, #e5e7eb);
  color: var(--color-text, #1f2937);
}

.btn--secondary:hover {
  background: var(--color-hover, #f3f4f6);
}

.unsaved-indicator {
  font-size: 11px;
  color: var(--color-warning, #f59e0b);
  margin-right: auto;
  align-self: center;
}
</style>
