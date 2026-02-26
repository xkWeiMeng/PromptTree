import { ref, computed } from 'vue'
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
  const results = ref<SearchResult[]>([])

  const hasQuery = computed(() => query.value.trim().length > 0)

  function search(searchQuery: string) {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      results.value = []
      return
    }

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
  }

  function highlightText(text: string, q: string): string {
    if (!text) return ''
    const regex = new RegExp(`(${escapeRegex(q)})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  function getSnippet(content: string, q: string, ctx = 30): string {
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

  return { query, results, hasQuery, search, clear }
}
