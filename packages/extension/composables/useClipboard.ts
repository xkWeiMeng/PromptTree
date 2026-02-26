import { ref } from 'vue'
import { extractVariables, fillVariables } from '@prompttree/shared'
import { sendToCurrentTab } from '@/utils/messaging'
import { useToast } from './useToast'

export function useClipboard() {
  const { success, error } = useToast()
  const isCopying = ref(false)

  /** 复制文本到剪贴板 */
  async function copy(text: string): Promise<boolean> {
    if (isCopying.value) return false
    isCopying.value = true
    try {
      await navigator.clipboard.writeText(text)
      success('已复制到剪贴板')
      return true
    } catch {
      error('复制失败')
      return false
    } finally {
      isCopying.value = false
    }
  }

  /** 复制内容（检查变量） */
  async function copyContent(content: string): Promise<string[] | null> {
    const variables = extractVariables(content)
    if (variables.length === 0) {
      await copy(content)
      return null
    }
    return variables
  }

  /** 填充变量后复制 */
  async function copyWithVariables(content: string, values: Record<string, string>): Promise<boolean> {
    const filled = fillVariables(content, values)
    return copy(filled)
  }

  /** 填入当前页面（无变量） */
  async function injectContent(content: string): Promise<boolean> {
    const variables = extractVariables(content)
    if (variables.length > 0) return false

    const response = await sendToCurrentTab({ type: 'INJECT_PROMPT', text: content })
    if (response.success) {
      success('已填入页面')
      return true
    } else {
      // fallback 到剪贴板
      await copy(content)
      error('当前页面不支持填入，已复制到剪贴板')
      return false
    }
  }

  /** 填充变量后填入 */
  async function injectWithVariables(content: string, values: Record<string, string>): Promise<boolean> {
    const filled = fillVariables(content, values)
    const response = await sendToCurrentTab({ type: 'INJECT_PROMPT', text: filled })
    if (response.success) {
      success('已填入页面')
      return true
    } else {
      await copy(filled)
      error('当前页面不支持填入，已复制到剪贴板')
      return false
    }
  }

  return { isCopying, copy, copyContent, copyWithVariables, injectContent, injectWithVariables }
}
