import { ref } from 'vue'
import { extractVariables, fillVariables } from '@prompttree/shared'
import { useToast } from './useToast'
import { i18n } from '@/i18n'

/**
 * 剪贴板组合式函数
 */
export function useClipboard() {
  const { success, error } = useToast()
  
  const isCopying = ref(false)
  
  /**
   * 复制文本到剪贴板
   */
  async function copy(text: string): Promise<boolean> {
    if (isCopying.value) return false
    
    isCopying.value = true
    
    try {
      await navigator.clipboard.writeText(text)
      success(i18n.global.t('clipboard.copied'))
      return true
    } catch (err) {
      console.error('Copy failed:', err)
      error(i18n.global.t('clipboard.copyFailed'))
      return false
    } finally {
      isCopying.value = false
    }
  }
  
  /**
   * 复制内容（检查是否有变量）
   * @returns 需要填充变量返回 variables 数组，否则直接复制并返回 null
   */
  async function copyContent(content: string): Promise<string[] | null> {
    const variables = extractVariables(content)
    
    if (variables.length === 0) {
      // 无变量，直接复制
      await copy(content)
      return null
    }
    
    // 有变量，返回变量列表供调用者处理
    return variables
  }
  
  /**
   * 填充变量并复制
   */
  async function copyWithVariables(
    content: string, 
    values: Record<string, string>
  ): Promise<boolean> {
    const filledContent = fillVariables(content, values)
    return copy(filledContent)
  }
  
  return {
    isCopying,
    copy,
    copyContent,
    copyWithVariables
  }
}
