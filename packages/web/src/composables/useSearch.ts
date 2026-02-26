import { ref, computed, watch } from 'vue'
import { useTreeStore } from '@/stores/tree'
import type { LocalNode } from '@/db'

export interface SearchResult {
  node: LocalNode
  matchType: 'title' | 'content' | 'both'
  titleHighlight?: string
  contentHighlight?: string
}

/**
 * 搜索组合式函数
 */
export function useSearch() {
  const treeStore = useTreeStore()
  
  const query = ref('')
  const isSearching = ref(false)
  const results = ref<SearchResult[]>([])
  
  // 是否有搜索内容
  const hasQuery = computed(() => query.value.trim().length > 0)
  
  // 搜索逻辑
  function search(searchQuery: string) {
    const q = searchQuery.trim().toLowerCase()
    
    if (!q) {
      results.value = []
      return
    }
    
    isSearching.value = true
    
    // 在活跃节点中搜索
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
          contentHighlight: contentMatch ? highlightText(getContentSnippet(node.content, q), q) : undefined
        })
      }
    }
    
    // 按匹配类型排序：both > title > content
    searchResults.sort((a, b) => {
      const priority = { both: 0, title: 1, content: 2 }
      return priority[a.matchType] - priority[b.matchType]
    })
    
    results.value = searchResults
    isSearching.value = false
  }
  
  // 高亮文本
  function highlightText(text: string, query: string): string {
    if (!text) return ''
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }
  
  // 获取内容片段（显示匹配位置前后的上下文）
  function getContentSnippet(content: string, query: string, contextLength = 50): string {
    if (!content) return ''
    
    const lowerContent = content.toLowerCase()
    const index = lowerContent.indexOf(query.toLowerCase())
    
    if (index === -1) return content.slice(0, contextLength * 2)
    
    const start = Math.max(0, index - contextLength)
    const end = Math.min(content.length, index + query.length + contextLength)
    
    let snippet = content.slice(start, end)
    
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'
    
    return snippet
  }
  
  // 转义正则特殊字符
  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  
  // 清空搜索
  function clear() {
    query.value = ''
    results.value = []
  }
  
  // 选择搜索结果
  function selectResult(nodeId: string) {
    treeStore.selectNode(nodeId)
    
    // 展开父节点路径
    let current = treeStore.getNode(nodeId)
    while (current?.parentId) {
      treeStore.expandedIds.add(current.parentId)
      current = treeStore.getNode(current.parentId)
    }
  }
  
  // 监听搜索词变化（防抖）
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  watch(query, (newQuery) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      search(newQuery)
    }, 150)
  })
  
  return {
    query,
    results,
    hasQuery,
    isSearching,
    search,
    clear,
    selectResult
  }
}
