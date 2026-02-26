<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSearch } from '@/composables/useSearch'
import { useTreeStore } from '@/stores/tree'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const treeStore = useTreeStore()
const { query, results, hasQuery, search, clear } = useSearch()
const inputRef = ref<HTMLInputElement | null>(null)

// 防抖搜索
let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => search(val), 150)
})

function handleSelect(id: string) {
  treeStore.selectNode(id)
  emit('close')
}

function handleClear() {
  clear()
  emit('close')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClear()
  }
}

// 自动聚焦
function focusInput() {
  inputRef.value?.focus()
}

defineExpose({ focusInput })
</script>

<template>
  <div class="search-bar" @keydown="handleKeydown">
    <div class="search-input-wrap">
      <span class="search-icon">🔍</span>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="搜索 Prompt..."
        class="search-input"
      />
      <span v-if="hasQuery" class="search-clear" @click="handleClear">✕</span>
    </div>

    <!-- 搜索结果 -->
    <div v-if="hasQuery" class="search-results">
      <div
        v-for="result in results"
        :key="result.node.id"
        class="search-item"
        @click="handleSelect(result.node.id)"
      >
        <span class="search-item-icon">{{ result.node.type === 'folder' ? '📁' : '📄' }}</span>
        <div class="search-item-content">
          <div
            v-if="result.titleHighlight"
            class="search-item-title"
            v-html="result.titleHighlight"
          />
          <div v-else class="search-item-title">{{ result.node.title }}</div>
          <div
            v-if="result.contentHighlight"
            class="search-item-snippet"
            v-html="result.contentHighlight"
          />
        </div>
      </div>

      <div v-if="results.length === 0" class="search-empty">无搜索结果</div>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  flex-direction: column;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.search-icon {
  font-size: 13px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  background: transparent;
  color: var(--color-text, #1f2937);
}

.search-clear {
  cursor: pointer;
  color: var(--color-text-secondary, #9ca3af);
  font-size: 12px;
}

.search-results {
  max-height: 360px;
  overflow-y: auto;
  padding: 4px;
}

.search-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
}

.search-item:hover {
  background: var(--color-hover, #f3f4f6);
}

.search-item-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

.search-item-content {
  flex: 1;
  overflow: hidden;
}

.search-item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text, #1f2937);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-item-snippet {
  font-size: 12px;
  color: var(--color-text-secondary, #9ca3af);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-item-snippet :deep(mark),
.search-item-title :deep(mark) {
  background: #fef08a;
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}

.search-empty {
  text-align: center;
  padding: 24px;
  color: var(--color-text-secondary, #9ca3af);
  font-size: 13px;
}
</style>
