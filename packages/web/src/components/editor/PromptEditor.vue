<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { extractVariables } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import { Pencil, Braces, Copy, Check, X, FileText, Share2, Search, Replace } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps<{
  nodeId: string
}>()

const emit = defineEmits<{
  (e: 'showVariables'): void
  (e: 'share', nodeId: string): void
}>()

const treeStore = useTreeStore()

// 当前节点
const node = computed(() => treeStore.nodes.find(n => n.id === props.nodeId))

// 本地编辑状态
const title = ref('')
const content = ref('')
const isTitleEditing = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
const contentTextarea = ref<HTMLTextAreaElement | null>(null)

// 提取的变量
const variables = computed(() => {
  if (!content.value) return []
  return extractVariables(content.value)
})

// 自动保存状态
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
let savedTimer: ReturnType<typeof setTimeout> | null = null

// 复制按钮成功动画
const copySuccess = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

// 保存定时器
let saveTimer: ReturnType<typeof setTimeout> | null = null

// 追踪上一个节点ID
let lastNodeId = ''

// 监听节点ID变化
watch(() => props.nodeId, (newId) => {
  if (newId !== lastNodeId) {
    lastNodeId = newId
    saveStatus.value = 'idle'
    if (node.value) {
      title.value = node.value.title
      content.value = node.value.content || ''
    }
  }
}, { immediate: true })

// 监听内容变化，自动保存
watch([title, content], () => {
  if (!node.value) return
  if (saveTimer) clearTimeout(saveTimer)
  if (savedTimer) clearTimeout(savedTimer)
  saveStatus.value = 'saving'
  saveTimer = setTimeout(async () => {
    if (title.value !== node.value?.title || content.value !== node.value?.content) {
      try {
        await treeStore.updateNode(props.nodeId, {
          title: title.value,
          content: content.value
        })
        saveStatus.value = 'saved'
        savedTimer = setTimeout(() => {
          saveStatus.value = 'idle'
        }, 2000)
      } catch {
        saveStatus.value = 'error'
      }
    } else {
      saveStatus.value = 'idle'
    }
  }, 500)
})

// 开始编辑标题
async function startEditTitle() {
  isTitleEditing.value = true
  await nextTick()
  titleInput.value?.focus()
  titleInput.value?.select()
}

// 结束编辑标题
function finishEditTitle() {
  isTitleEditing.value = false
}

// 标题键盘事件
function handleTitleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    finishEditTitle()
    contentTextarea.value?.focus()
  }
  if (e.key === 'Escape') {
    finishEditTitle()
  }
}

// 插入变量
function insertVariable(varName: string = 'variable') {
  const textarea = contentTextarea.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = content.value
  const variable = `{{${varName}}}`
  content.value = text.slice(0, start) + variable + text.slice(end)
  nextTick(() => {
    const newPos = start + variable.length
    textarea.setSelectionRange(newPos, newPos)
    textarea.focus()
  })
}

// 复制内容
async function copyContent() {
  try {
    await navigator.clipboard.writeText(content.value)
    copySuccess.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (e) {
    console.error('复制失败:', e)
  }
}

// 复制并填充变量
function copyWithVariables() {
  emit('showVariables')
}

// 分享当前节点
function shareCurrentNode() {
  emit('share', props.nodeId)
}

// 关闭编辑器
function closeEditor() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (node.value && (title.value !== node.value.title || content.value !== node.value.content)) {
    treeStore.updateNode(props.nodeId, {
      title: title.value,
      content: content.value
    })
  }
  treeStore.closeEditor()
}

onMounted(() => {
  if (node.value) {
    title.value = node.value.title
    content.value = node.value.content || ''
  }
})

// ===================
// Find & Replace
// ===================
const showFindReplace = ref(false)
const findQuery = ref('')
const replaceQuery = ref('')
const findInputRef = ref<HTMLInputElement | null>(null)

const matchCount = computed(() => {
  if (!findQuery.value) return 0
  const regex = new RegExp(escapeRegex(findQuery.value), 'gi')
  return (content.value.match(regex) || []).length
})

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toggleFindReplace() {
  showFindReplace.value = !showFindReplace.value
  if (showFindReplace.value) {
    nextTick(() => findInputRef.value?.focus())
  }
}

function replaceOne() {
  if (!findQuery.value) return
  const regex = new RegExp(escapeRegex(findQuery.value), 'i')
  content.value = content.value.replace(regex, replaceQuery.value)
}

function replaceAll() {
  if (!findQuery.value) return
  const regex = new RegExp(escapeRegex(findQuery.value), 'gi')
  content.value = content.value.replace(regex, replaceQuery.value)
}

function closeFindReplace() {
  showFindReplace.value = false
  findQuery.value = ''
  replaceQuery.value = ''
}

// ===================
// Variable Autocomplete
// ===================
const showAutocomplete = ref(false)
const autocompleteItems = ref<string[]>([])
const autocompletePos = ref({ top: 0, left: 0 })
const autocompleteIndex = ref(0)

/** Collect all known variable names from all nodes */
const allVariableNames = computed(() => {
  const vars = new Set<string>()
  for (const n of treeStore.nodes) {
    if (n.content && n.deletedAt === null) {
      for (const v of extractVariables(n.content)) {
        vars.add(v)
      }
    }
  }
  return Array.from(vars).sort()
})

function handleContentInput(e: Event) {
  const textarea = e.target as HTMLTextAreaElement
  const pos = textarea.selectionStart
  const textBefore = content.value.slice(0, pos)

  // Check if user just typed {{
  if (textBefore.endsWith('{{')) {
    const filtered = allVariableNames.value
    if (filtered.length > 0) {
      autocompleteItems.value = filtered
      autocompleteIndex.value = 0

      // Approximate cursor position
      const linesBefore = textBefore.split('\n')
      const lineNum = linesBefore.length - 1
      const charInLine = linesBefore[linesBefore.length - 1].length

      const lineHeight = 24
      const charWidth = 8
      autocompletePos.value = {
        top: lineNum * lineHeight + 40,
        left: Math.min(charInLine * charWidth, 300)
      }
      showAutocomplete.value = true
    }
    return
  }

  // If autocomplete is showing, filter by text after {{
  if (showAutocomplete.value) {
    const match = textBefore.match(/\{\{(\w*)$/)
    if (match) {
      const partial = match[1].toLowerCase()
      autocompleteItems.value = allVariableNames.value.filter(v => v.toLowerCase().includes(partial))
      autocompleteIndex.value = 0
      if (autocompleteItems.value.length === 0) {
        showAutocomplete.value = false
      }
    } else {
      showAutocomplete.value = false
    }
  }
}

function selectAutocomplete(varName: string) {
  const textarea = contentTextarea.value
  if (!textarea) return

  const pos = textarea.selectionStart
  const textBefore = content.value.slice(0, pos)
  const textAfter = content.value.slice(pos)

  // Find the {{ prefix
  const match = textBefore.match(/\{\{(\w*)$/)
  if (match) {
    const prefix = textBefore.slice(0, textBefore.length - match[0].length)
    content.value = prefix + '{{' + varName + '}}' + textAfter
    const newPos = prefix.length + varName.length + 4
    nextTick(() => {
      textarea.setSelectionRange(newPos, newPos)
      textarea.focus()
    })
  }
  showAutocomplete.value = false
}

function handleAutocompleteKeydown(e: KeyboardEvent) {
  if (!showAutocomplete.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    autocompleteIndex.value = Math.min(autocompleteIndex.value + 1, autocompleteItems.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    autocompleteIndex.value = Math.max(autocompleteIndex.value - 1, 0)
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    if (autocompleteItems.value.length > 0) {
      e.preventDefault()
      selectAutocomplete(autocompleteItems.value[autocompleteIndex.value])
    }
  } else if (e.key === 'Escape') {
    showAutocomplete.value = false
  }
}

defineExpose({ toggleFindReplace })
</script>

<template>
  <div class="prompt-editor" v-if="node">
    <!-- 头部 -->
    <div class="editor-header">
      <div class="title-section">
        <input
          v-if="isTitleEditing"
          ref="titleInput"
          v-model="title"
          class="title-input"
          :placeholder="t('editor.titlePlaceholder')"
          @blur="finishEditTitle"
          @keydown="handleTitleKeydown"
        />
        <h1 v-else class="title" role="button" tabindex="0" @click="startEditTitle" @keydown.enter="startEditTitle">
          {{ title || t('common.untitled') }}
          <Pencil :size="14" class="edit-hint" />
          <span class="click-to-edit-hint">{{ t('editor.clickToEdit') }}</span>
        </h1>
      </div>
      
      <div class="actions">
        <button class="icon-btn" :title="t('editor.findReplace')" :aria-label="t('editor.findReplace')" @click="toggleFindReplace">
          <Search :size="16" />
        </button>
        <button class="icon-btn" :title="t('editor.insertVariable')" :aria-label="t('editor.insertVariable')" @click="insertVariable()">
          <Braces :size="16" />
        </button>
        <button class="icon-btn" :class="{ 'copy-success': copySuccess }" :title="t('common.copy')" :aria-label="t('common.copy')" @click="copyContent">
          <Check v-if="copySuccess" :size="16" />
          <Copy v-else :size="16" />
        </button>
        <button class="icon-btn" :title="t('share.action')" :aria-label="t('share.action')" @click="shareCurrentNode">
          <Share2 :size="16" />
        </button>
        <button 
          v-if="variables.length > 0"
          class="btn-primary" 
          @click="copyWithVariables"
        >
          {{ t('editor.fillAndCopy') }}
        </button>
        <button class="icon-btn close" :title="t('editor.closeHint')" :aria-label="t('editor.closeHint')" @click="closeEditor">
          <X :size="16" />
        </button>
      </div>
    </div>
    
    <!-- 变量提示 -->
    <div v-if="variables.length > 0" class="variables-bar">
      <span class="label">{{ t('editor.variablesLabel') }}</span>
      <span v-for="v in variables" :key="v" class="variable-tag">
        {{ v }}
      </span>
    </div>
    
    <!-- 编辑区 -->
    <div class="editor-content">
      <!-- Find & Replace bar -->
      <Transition name="slide">
        <div v-if="showFindReplace" class="find-replace-bar">
          <div class="find-row">
            <Search :size="14" class="find-icon" />
            <input
              ref="findInputRef"
              v-model="findQuery"
              type="text"
              class="find-input"
              :placeholder="t('editor.find')"
            />
            <span class="match-indicator">
              {{ findQuery ? (matchCount > 0 ? t('editor.matchCount', { count: matchCount }) : t('editor.noMatches')) : '' }}
            </span>
          </div>
          <div class="replace-row">
            <Replace :size="14" class="find-icon" />
            <input
              v-model="replaceQuery"
              type="text"
              class="find-input"
              :placeholder="t('editor.replace')"
            />
            <button class="find-btn" @click="replaceOne" :disabled="matchCount === 0">{{ t('editor.replaceOne') }}</button>
            <button class="find-btn" @click="replaceAll" :disabled="matchCount === 0">{{ t('editor.replaceAll') }}</button>
            <button class="find-close" @click="closeFindReplace"><X :size="14" /></button>
          </div>
        </div>
      </Transition>

      <div class="textarea-wrapper">
        <textarea
          ref="contentTextarea"
          v-model="content"
          class="content-textarea"
          :placeholder="t('editor.contentPlaceholder')"
          @input="handleContentInput"
          @keydown="handleAutocompleteKeydown"
        />

        <!-- Variable autocomplete dropdown -->
        <div
          v-if="showAutocomplete && autocompleteItems.length > 0"
          class="autocomplete-dropdown"
          :style="{ top: autocompletePos.top + 'px', left: autocompletePos.left + 'px' }"
        >
          <div
            v-for="(item, idx) in autocompleteItems"
            :key="item"
            class="autocomplete-item"
            :class="{ active: idx === autocompleteIndex }"
            @click="selectAutocomplete(item)"
            @mouseenter="autocompleteIndex = idx"
          >
            <Braces :size="12" />
            <span>{{ item }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部状态 -->
    <div class="editor-footer">
      <div class="footer-left">
        <span class="char-count">{{ content.length }} {{ t('editor.charCount') }}</span>
        <span
          v-if="saveStatus !== 'idle'"
          class="save-status"
          :class="saveStatus"
          aria-live="polite"
        >
          <template v-if="saveStatus === 'saving'">{{ t('editor.saving') }}</template>
          <template v-else-if="saveStatus === 'saved'">{{ t('editor.saved') }}</template>
          <template v-else-if="saveStatus === 'error'">{{ t('editor.saveFailed') }}</template>
        </span>
      </div>
      <span v-if="node.updatedAt" class="update-time" aria-live="polite">
        {{ t('editor.lastUpdated') }} {{ new Date(node.updatedAt).toLocaleString() }}
      </span>
    </div>
  </div>
  
  <!-- 空状态 -->
  <div v-else class="empty-editor">
    <FileText :size="48" class="empty-icon" />
    <p>{{ t('editor.emptyState') }}</p>
  </div>
</template>

<style scoped>
.prompt-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

/* ===================
   Header
   =================== */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border-secondary);
}

.title-section {
  flex: 1;
}

.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-tight);
  margin: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-primary);
  border-bottom: 1.5px dashed var(--border-secondary);
  padding-bottom: 2px;
}

.edit-hint {
  opacity: 0.3;
  color: var(--text-tertiary);
  transition: opacity var(--duration-fast) ease;
}

.title:hover .edit-hint {
  opacity: 0.8;
}

.click-to-edit-hint {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  color: var(--text-quaternary);
  opacity: 0;
  transition: opacity var(--duration-fast) ease;
}

.title:hover .click-to-edit-hint {
  opacity: 1;
}

.title-input {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-tight);
  border: none;
  outline: none;
  width: 100%;
  padding: 0;
  background: transparent;
  color: var(--text-primary);
  border-bottom: 2px solid var(--color-accent);
}

.title-input:focus-visible {
  box-shadow: 0 2px 0 var(--color-accent);
}

/* ===================
   Actions
   =================== */
.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.icon-btn.close:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

/* ===================
   Variables Bar
   =================== */
.variables-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-secondary);
  flex-wrap: wrap;
}

.variables-bar .label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.variable-tag {
  display: inline-block;
  padding: 2px var(--space-2);
  background: var(--accent-bg-subtle);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-medium);
}

/* ===================
   Content
   =================== */
.editor-content {
  flex: 1;
  padding: var(--space-4) var(--space-5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.textarea-wrapper {
  flex: 1;
  position: relative;
}

.content-textarea {
  width: 100%;
  height: 100%;
  border: none;
  border-left: 2px solid transparent;
  outline: none;
  resize: none;
  font-size: var(--font-size-md);
  line-height: var(--line-height-relaxed);
  font-family: inherit;
  color: var(--text-primary);
  background: transparent;
  transition: border-color var(--duration-fast) ease,
    background-color var(--duration-fast) ease;
}

.content-textarea:focus {
  border-left-color: var(--color-accent);
  background: var(--accent-bg-hover);
}

.content-textarea::placeholder {
  color: var(--text-tertiary);
}

/* ===================
   Find & Replace
   =================== */
.find-replace-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.find-row,
.replace-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.find-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.find-input {
  flex: 1;
  padding: 4px var(--space-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.find-input:focus {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus-ring);
}

.match-indicator {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.find-btn {
  padding: 4px var(--space-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
}

.find-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.find-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.find-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-xs);
}

.find-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.slide-enter-active,
.slide-leave-active {
  transition: all var(--duration-normal) var(--ease-out);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  padding: 0;
  overflow: hidden;
}

/* ===================
   Variable Autocomplete
   =================== */
.autocomplete-dropdown {
  position: absolute;
  z-index: var(--z-dropdown);
  background: var(--bg-elevated);
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-popover);
  max-height: 160px;
  overflow-y: auto;
  min-width: 140px;
  padding: var(--space-1);
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
  font-family: var(--font-mono);
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-xs);
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.autocomplete-item svg {
  flex-shrink: 0;
}

/* ===================
   Copy Success
   =================== */
.icon-btn.copy-success {
  color: var(--color-success);
}

/* ===================
   Footer
   =================== */
.editor-footer {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) var(--space-5);
  border-top: 1px solid var(--border-secondary);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.save-status {
  transition: opacity var(--duration-fast) ease;
}

.save-status.saving {
  color: var(--text-secondary);
}

.save-status.saved {
  color: var(--color-success);
  animation: fade-out 0.5s ease 1.5s forwards;
}

.save-status.error {
  color: var(--color-danger);
}

/* ===================
   Empty State
   =================== */
.empty-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  gap: var(--space-3);
}

.empty-icon {
  color: var(--text-quaternary);
}

.empty-editor p {
  margin: 0;
  font-size: var(--font-size-md);
}

/* ===================
   Mobile
   =================== */
@media (max-width: 768px) {
  .icon-btn {
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
  }
}

@media (max-width: 640px) {
  .editor-header {
    padding: var(--space-2) var(--space-3);
  }

  .editor-content {
    padding: var(--space-3) var(--space-3);
  }

  .variables-bar {
    padding: var(--space-2) var(--space-3);
  }

  .editor-footer {
    padding: var(--space-2) var(--space-3);
  }
}
</style>
