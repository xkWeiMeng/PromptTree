<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { extractVariables } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import { Pencil, Braces, Copy, X, FileText, Share2 } from 'lucide-vue-next'

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

// 保存定时器
let saveTimer: ReturnType<typeof setTimeout> | null = null

// 追踪上一个节点ID
let lastNodeId = ''

// 监听节点ID变化
watch(() => props.nodeId, (newId) => {
  if (newId !== lastNodeId) {
    lastNodeId = newId
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
  saveTimer = setTimeout(async () => {
    if (title.value !== node.value?.title || content.value !== node.value?.content) {
      await treeStore.updateNode(props.nodeId, {
        title: title.value,
        content: content.value
      })
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
        <h1 v-else class="title" @click="startEditTitle">
          {{ title || t('common.untitled') }}
          <Pencil :size="14" class="edit-hint" />
        </h1>
      </div>
      
      <div class="actions">
        <button class="icon-btn" :title="t('editor.insertVariable')" @click="insertVariable()">
          <Braces :size="16" />
        </button>
        <button class="icon-btn" :title="t('common.copy')" @click="copyContent">
          <Copy :size="16" />
        </button>
        <button class="icon-btn" :title="t('share.action')" @click="shareCurrentNode">
          <Share2 :size="16" />
        </button>
        <button 
          v-if="variables.length > 0"
          class="btn-primary" 
          @click="copyWithVariables"
        >
          {{ t('editor.fillAndCopy') }}
        </button>
        <button class="icon-btn close" :title="t('editor.closeHint')" @click="closeEditor">
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
      <textarea
        ref="contentTextarea"
        v-model="content"
        class="content-textarea"
        :placeholder="t('editor.contentPlaceholder')"
      />
    </div>
    
    <!-- 底部状态 -->
    <div class="editor-footer">
      <span class="char-count">{{ content.length }} {{ t('editor.charCount') }}</span>
      <span v-if="node.updatedAt" class="update-time">
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
  border-bottom: 0.5px solid var(--border-secondary);
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
}

.edit-hint {
  opacity: 0;
  color: var(--text-tertiary);
  transition: opacity var(--duration-fast) ease;
}

.title:hover .edit-hint {
  opacity: 0.6;
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
  border-bottom: 0.5px solid var(--border-secondary);
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
}

.content-textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: var(--font-size-md);
  line-height: var(--line-height-relaxed);
  font-family: inherit;
  color: var(--text-primary);
  background: transparent;
}

.content-textarea::placeholder {
  color: var(--text-tertiary);
}

/* ===================
   Footer
   =================== */
.editor-footer {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) var(--space-5);
  border-top: 0.5px solid var(--border-secondary);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
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
</style>
