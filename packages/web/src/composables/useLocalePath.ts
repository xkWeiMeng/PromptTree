/**
 * Composable: 生成带当前 locale 前缀的路径
 * 用于替代模板中的硬编码路径
 */
import { useI18n } from 'vue-i18n'
import { getLocalePath, type SupportedLocale } from '@/utils/locale'

export function useLocalePath() {
  const { locale } = useI18n()

  /**
   * 生成带当前 locale 前缀的路径
   * @example localePath('/features') => '/en/features' (when locale is 'en')
   */
  function localePath(path: string): string {
    return getLocalePath(path, locale.value as SupportedLocale)
  }

  return { localePath }
}
