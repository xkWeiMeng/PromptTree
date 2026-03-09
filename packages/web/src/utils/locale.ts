/**
 * 多语言工具函数
 * - 支持语言列表与常量
 * - 浏览器语言检测
 * - 语言偏好持久化 (localStorage)
 * - 带 locale 前缀的路径生成
 */

// =================== 常量 ===================

export const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

/** localStorage key */
const LOCALE_STORAGE_KEY = 'prompttree-locale'

/** 语言显示名称 */
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja': '日本語',
  'ko': '한국어',
}

/** OG locale 映射 */
export const OG_LOCALE_MAP: Record<SupportedLocale, string> = {
  'en': 'en_US',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
  'ja': 'ja_JP',
  'ko': 'ko_KR',
}

/** html lang 属性映射 */
export const HTML_LANG_MAP: Record<SupportedLocale, string> = {
  'en': 'en',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'ja': 'ja',
  'ko': 'ko',
}

// =================== 不加 locale 前缀的路由 ===================

/** 这些路径不需要加语言前缀 */
const NON_LOCALE_PATHS = ['/app', '/login', '/share']

export function isNonLocalePath(path: string): boolean {
  return NON_LOCALE_PATHS.some(p => path === p || path.startsWith(p + '/'))
}

// =================== 语言检测 ===================

/**
 * 检测浏览器语言偏好，匹配支持的语言列表
 * 优先精确匹配（如 zh-CN），其次匹配语言前缀（如 zh → zh-CN）
 */
export function detectBrowserLocale(): SupportedLocale {
  const browserLangs = navigator.languages || [navigator.language]

  for (const lang of browserLangs) {
    // 精确匹配
    const exact = SUPPORTED_LOCALES.find(l => l.toLowerCase() === lang.toLowerCase())
    if (exact) return exact

    // 前缀匹配（如 zh → zh-CN, ja-JP → ja）
    const prefix = lang.split('-')[0].toLowerCase()
    const prefixMatch = SUPPORTED_LOCALES.find(l => l.toLowerCase().startsWith(prefix))
    if (prefixMatch) return prefixMatch
  }

  return DEFAULT_LOCALE
}

// =================== 偏好持久化 ===================

/**
 * 保存语言偏好到 localStorage
 */
export function saveLocalePreference(locale: SupportedLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // localStorage 不可用时静默忽略
  }
}

/**
 * 从 localStorage 读取语言偏好
 */
export function getLocalePreference(): SupportedLocale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale
    }
  } catch {
    // localStorage 不可用时静默忽略
  }
  return null
}

/**
 * 获取当前应使用的语言：localStorage 偏好 > 浏览器检测 > 默认
 */
export function resolveLocale(): SupportedLocale {
  return getLocalePreference() || detectBrowserLocale()
}

// =================== 路径工具 ===================

/**
 * 验证字符串是否为合法的 locale
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}

/**
 * 从路由路径中提取 locale
 * 如 /en/features → 'en', /zh-CN/docs/sync → 'zh-CN'
 */
export function extractLocaleFromPath(path: string): SupportedLocale | null {
  const segments = path.split('/').filter(Boolean)
  if (segments.length > 0 && isValidLocale(segments[0])) {
    return segments[0] as SupportedLocale
  }
  return null
}

/**
 * 生成带 locale 前缀的路径
 * - 非 locale 路径（/app, /login）原样返回
 * - 已有 locale 前缀的路径会替换
 *
 * @example
 * getLocalePath('/features', 'en') → '/en/features'
 * getLocalePath('/docs/sync', 'ja') → '/ja/docs/sync'
 * getLocalePath('/', 'zh-CN') → '/zh-CN'
 * getLocalePath('/app', 'en') → '/app'
 */
export function getLocalePath(path: string, locale: SupportedLocale): string {
  // 非 locale 路径直接返回
  if (isNonLocalePath(path)) {
    return path
  }

  // 去除已有的 locale 前缀
  const stripped = stripLocalePath(path)

  // 根路径
  if (stripped === '/' || stripped === '') {
    return `/${locale}`
  }

  return `/${locale}${stripped}`
}

/**
 * 去除路径中的 locale 前缀
 * /en/features → /features, /zh-CN → /
 */
export function stripLocalePath(path: string): string {
  const segments = path.split('/').filter(Boolean)
  if (segments.length > 0 && isValidLocale(segments[0])) {
    const rest = segments.slice(1).join('/')
    return rest ? `/${rest}` : '/'
  }
  return path
}
