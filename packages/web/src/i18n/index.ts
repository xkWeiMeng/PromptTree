/**
 * Vue I18n 实例配置
 * - Composition API 模式 (legacy: false)
 * - 默认加载 en + zh-CN，其他语言懒加载
 * - 回退语言: en
 */
import { createI18n } from 'vue-i18n'
import { resolveLocale, type SupportedLocale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/utils/locale'

// 默认语言包（同步加载）
import en from '@/locales/en.json'
import zhCN from '@/locales/zh-CN.json'

export type MessageSchema = typeof en

const i18n = createI18n<[MessageSchema], SupportedLocale>({
  legacy: false,
  locale: resolveLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    'en': en,
    'zh-CN': zhCN,
  },
  // 抑制回退警告（开发时减少噪音）
  missingWarn: false,
  fallbackWarn: false,
})

/**
 * 懒加载语言包
 * 已加载的语言不会重复请求
 */
const loadedLocales = new Set<string>(['en', 'zh-CN'])

export async function loadLocaleMessages(locale: SupportedLocale): Promise<void> {
  if (loadedLocales.has(locale)) return

  // 动态导入语言包
  const messages = await import(`@/locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, messages.default)
  loadedLocales.add(locale)
}

/**
 * 切换语言
 * - 懒加载语言包
 * - 更新 i18n locale
 * - 更新 <html lang>
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  await loadLocaleMessages(locale)
  ;(i18n.global.locale as any).value = locale
  document.documentElement.setAttribute('lang', locale)
}

export { SUPPORTED_LOCALES, DEFAULT_LOCALE }
export { i18n }
export default i18n
