<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTreeStore } from '@/stores/tree'
import { useSearch } from '@/composables/useSearch'
import {
  Search, X, Folder, FileText, Plus,
  ChevronsDownUp, ChevronsUpDown, ArrowUpDown
} from 'lucide-vue-next'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'create', type: 'folder' | 'prompt'): void
}>()

const treeStore = useTreeStore()
const { query, results, hasQuery, selectResult, clear } = useSearch()

// 新建菜单状态
const showCreateMenu = ref(false)

// 排序状态
export type SortOption = 'default' | 'name-asc' | 'name-desc' | 'newest' | 'oldest'
const sortOption = ref<SortOption>('default')
const showSortMenu = ref(false)

const sortOptions: { value: SortOption; labelKey: string }[] = [
  { value: 'default', labelKey: 'tree.sortDefault' },
  { value: 'name-asc', labelKey: 'tree.sortNameAsc' },
  { value: 'name-desc', labelKey: 'tree.sortNameDesc' },
  { value: 'newest', labelKey: 'tree.sortNewest' },
  { value: 'oldest', labelKey: 'tree.sortOldest' }
]

function selectSort(option: SortOption) {
  sortOption.value = option
  showSortMenu.value = false
}

// 是否全部展开
const isAllExpanded = computed(() => {
  const folders = treeStore.nodes.filter(n => n.type === 'folder' && n.deletedAt === null)
  if (folders.length === 0) return false
  return folders.every(f => treeStore.expandedIds.has(f.id))
})

// 展开所有
function expandAll() {
  const folders = treeStore.nodes.filter(n => n.type === 'folder' && n.deletedAt === null)
  for (const folder of folders) {
    treeStore.expandedIds.add(folder.id)
  }
}

// 折叠所有
function collapseAll() {
  treeStore.expandedIds.clear()
}

// 切换展开/折叠
function toggleExpandAll() {
  if (isAllExpanded.value) {
    collapseAll()
  } else {
    expandAll()
  }
}

// 创建节点
function handleCreate(type: 'folder' | 'prompt') {
  emit('create', type)
  showCreateMenu.value = false
}

// 选择搜索结果
function handleSelectResult(nodeId: string) {
  selectResult(nodeId)
  clear()
}

// 点击外部关闭菜单
function handleClickOutside() {
  showCreateMenu.value = false
}

// 搜索框 ref
const searchInputRef = ref<HTMLInputElement | null>(null)

// 聚焦搜索框
function focusSearch() {
  searchInputRef.value?.focus()
}

defineExpose({ focusSearch, sortOption })
</script>

<template>
  <div class="tree-toolbar">
    <!-- 搜索框 -->
    <div class="search-wrapper">
      <input
        ref="searchInputRef"
        v-model="query"
        type="text"
        class="search-input"
        :placeholder="t('tree.searchPlaceholder')"
        aria-label="Search prompts"
      />
      <Search :size="14" class="search-icon" />
      <button v-if="hasQuery" class="search-clear" :aria-label="t('tree.clearSearch')" @click="clear">
        <X :size="12" />
      </button>
      
      <!-- 搜索结果下拉 -->
      <Transition name="popover">
        <div v-if="hasQuery && results.length > 0" class="search-results">
          <div
            v-for="result in results"
            :key="result.node.id"
            class="search-result-item"
            @click="handleSelectResult(result.node.id)"
          >
            <component 
              :is="result.node.type === 'folder' ? Folder : FileText" 
              :size="15" 
              class="result-icon"
            />
            <div class="result-content">
              <div 
                class="result-title"
                v-html="result.titleHighlight || result.node.title || t('common.untitled')"
              />
              <div 
                v-if="result.contentHighlight"
                class="result-snippet"
                v-html="result.contentHighlight"
              />
            </div>
          </div>
        </div>
      </Transition>
      
      <!-- 无结果 -->
      <Transition name="popover">
        <div v-if="hasQuery && results.length === 0" class="search-results">
          <div class="no-results">{{ t('tree.noResults') }}</div>
        </div>
      </Transition>

      <!-- Screen reader result count announcement -->
      <span class="sr-only" aria-live="polite">
        {{ hasQuery ? (results.length > 0 ? results.length + ' results found' : 'No results found') : '' }}
      </span>
    </div>
    
    <!-- 操作按钮 -->
    <div class="toolbar-actions">
      <!-- 排序按钮 -->
      <div class="sort-dropdown" @click.stop>
        <button
          class="toolbar-btn"
          :class="{ active: sortOption !== 'default' }"
          @click="showSortMenu = !showSortMenu"
          :title="t('tree.sortBy')"
          :aria-label="t('tree.sortBy')"
          aria-haspopup="true"
          :aria-expanded="showSortMenu"
        >
          <ArrowUpDown :size="16" />
        </button>
        <Transition name="popover">
          <div v-if="showSortMenu" class="sort-menu" role="menu" @click.stop>
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              type="button"
              class="menu-item"
              :class="{ 'menu-item--active': sortOption === opt.value }"
              role="menuitem"
              @click="selectSort(opt.value)"
            >
              <span>{{ t(opt.labelKey) }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- 新建按钮 -->
      <div class="create-dropdown" @click.stop>
        <button 
          class="toolbar-btn primary"
          @click="showCreateMenu = !showCreateMenu"
          :title="t('tree.createNew')"
          :aria-label="t('tree.createNew')"
          aria-haspopup="true"
          :aria-expanded="showCreateMenu"
        >
          <Plus :size="16" />
        </button>
        <Transition name="popover">
          <div v-if="showCreateMenu" class="create-menu" role="menu" @click.stop>
            <button type="button" class="menu-item" role="menuitem" @click="handleCreate('folder')">
              <Folder :size="15" />
              <span>{{ t('tree.newFolder') }}</span>
            </button>
            <button type="button" class="menu-item" role="menuitem" @click="handleCreate('prompt')">
              <FileText :size="15" />
              <span>{{ t('tree.newPrompt') }}</span>
            </button>
          </div>
        </Transition>
      </div>
      
      <!-- 展开/折叠按钮 -->
      <button 
        class="toolbar-btn"
        @click="toggleExpandAll"
        :title="isAllExpanded ? t('tree.collapseAll') : t('tree.expandAll')"
        :aria-label="isAllExpanded ? t('tree.collapseAll') : t('tree.expandAll')"
      >
        <component :is="isAllExpanded ? ChevronsDownUp : ChevronsUpDown" :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.tree-toolbar {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 0.5px solid var(--border-secondary);
}

/* ===================
   Search — macOS Spotlight Style
   =================== */
.search-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 6px var(--space-2) 6px 30px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition: background var(--duration-fast) ease,
              box-shadow var(--duration-fast) ease;
}

.search-input:focus {
  outline: none;
  background: var(--bg-input);
  box-shadow: var(--shadow-focus-ring);
}

.search-icon {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-clear {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-xs);
}

.search-clear:hover {
  color: var(--text-secondary);
  background: var(--bg-quaternary);
}

/* ===================
   Search Results — Popover
   =================== */
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--space-1);
  background: var(--bg-popover);
  -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  backdrop-filter: blur(var(--glass-blur-heavy));
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-popover);
  max-height: 300px;
  overflow-y: auto;
  z-index: var(--z-dropdown);
  padding: var(--space-1);
}

.search-result-item {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color var(--duration-fast) ease;
  align-items: flex-start;
}

.search-result-item:hover {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.search-result-item:hover .result-icon,
.search-result-item:hover .result-title,
.search-result-item:hover .result-snippet {
  color: var(--text-on-accent);
}

.result-icon {
  flex-shrink: 0;
  color: var(--text-secondary);
  margin-top: 1px;
}

.result-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.result-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-title :deep(mark) {
  background: var(--accent-bg-subtle);
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
}

.search-result-item:hover .result-title :deep(mark) {
  background: rgba(255, 255, 255, 0.25);
}

.result-snippet {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-snippet :deep(mark) {
  background: var(--accent-bg-subtle);
  color: inherit;
}

.no-results {
  padding: var(--space-3);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

/* ===================
   Toolbar Actions
   =================== */
.toolbar-actions {
  display: flex;
  gap: var(--space-1);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) ease;
}

.toolbar-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.toolbar-btn.primary {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.toolbar-btn.primary:hover {
  background: var(--color-accent-hover);
}

.toolbar-btn.active {
  color: var(--color-accent);
}

/* ===================
   Sort Menu
   =================== */
.sort-dropdown {
  position: relative;
}

.sort-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-1);
  background: var(--bg-popover);
  -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  backdrop-filter: blur(var(--glass-blur-heavy));
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-popover);
  min-width: 140px;
  z-index: var(--z-dropdown);
  padding: var(--space-1);
}

.menu-item--active {
  background: var(--accent-bg-subtle);
  color: var(--color-accent) !important;
  font-weight: var(--font-weight-medium);
}

/* ===================
   Create Menu — macOS Dropdown
   =================== */
.create-dropdown {
  position: relative;
}

.create-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-1);
  background: var(--bg-popover);
  -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  backdrop-filter: blur(var(--glass-blur-heavy));
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-popover);
  min-width: 160px;
  z-index: var(--z-dropdown);
  padding: var(--space-1);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
  cursor: pointer;
  border-radius: var(--radius-xs);
  color: var(--text-primary);
  transition: background-color var(--duration-fast) ease;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.menu-item:hover {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.menu-item:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
