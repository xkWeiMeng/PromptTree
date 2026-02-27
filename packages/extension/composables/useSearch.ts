import { ref, computed, watch } from 'vue'
import { useTreeStore } from '@/stores/tree'
import type { LocalNode } from '@/utils/storage'

export interface SearchResult {
  node: LocalNode
  matchType: 'title' | 'content' | 'both'
  titleHighlight?: string
  contentHighlight?: string
}

export function useSearch() {
  const treeStore = useTreeStore()

  const query = ref('')
  const isSearching = ref(false)
  const results = ref<SearchResult[]>([])

  const hasQuery = computed(() => query.value.trim().length > 0)

  function search(searchQuery: string) {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      results.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true

    const activeNodes = treeStore.nodes.filter(n => n.deletedAt === null)
    const searchResults: SearchResult[] = []

    for (const node of activeNodes) {
      const titleMatch = node.title?.toLowerCase().includes(q)
      const contentMatch = node.content?.toLowerCase().includes(q)

      if (titleMatch || contentMatch) {
        searchResults.push({
          node,
          matchType: titleMatch && contentMatch ? 'both' : titleMatch ? 'title' : 'content',
          titleHighlight: titleMatch ? highlightText(node.title, q) : undefined,
          contentHighlight: contentMatch ? highlightText(getSnippet(node.content, q), q) : undefined,
        })
      }
    }

    // 排序：both > title > content
    const priority = { both: 0, title: 1, content: 2 }
    searchResults.sort((a, b) => priority[a.matchType] - priority[b.matchType])

    results.value = searchResults
    isSearching.value = false
  }

  function highlightText(text: string, q: string): string {
    if (!text) return ''
    const regex = new RegExp(`(${escapeRegex(q)})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  function getSnippet(content: string, q: string, ctx = 50): string {
    if (!content) return ''
    const i = content.toLowerCase().indexOf(q)
    if (i === -1) return content.slice(0, ctx * 2)
    const start = Math.max(0, i - ctx)
    const end = Math.min(content.length, i + q.length + ctx)
    let s = content.slice(start, end)
    if (start > 0) s = '...' + s
    if (end < content.length) s = s + '...'
    return s
  }

  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function clear() {
    query.value = ''
    results.value = []
  }

  /** 选择搜索结果：选中节点 + 展开父路径 + 导航到所在文件夹 */
  function selectResult(nodeId: string) {
    treeStore.selectNode(nodeId)

    // 展开父节点路径
    let current = treeStore.getNode(nodeId)
    while (current?.parentId) {
      treeStore.expandedIds.add(current.parentId)
      current = treeStore.getNode(current.parentId)
    }

    // 层级导航模式：导航到节点所在文件夹
    const node = treeStore.getNode(nodeId)
    if (node) {
      treeStore.navigateToFolder(node.parentId)
    }
  }

  // 监听搜索词变化（防抖 150ms）
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  watch(query, (newQuery) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      search(newQuery)
    }, 150)
  })

  return { query, results, hasQuery, isSearching, search, clear, selectResult }
}
