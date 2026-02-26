import * as Clipboard from 'expo-clipboard'
import { Alert } from 'react-native'
import { extractVariables, hasVariables } from '@prompttree/shared'

/**
 * 复制文本到剪贴板并提示
 */
export async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text)
}

/**
 * 检查 Prompt 是否需要变量填充
 * @returns 变量列表，空数组表示无变量
 */
export function getPromptVariables(content: string): string[] {
  if (!content) return []
  return extractVariables(content)
}

/**
 * 直接复制 Prompt（无变量场景）
 */
export async function copyPromptDirect(content: string): Promise<void> {
  await copyToClipboard(content)
  Alert.alert('已复制', 'Prompt 内容已复制到剪贴板', [{ text: '好的' }])
}
