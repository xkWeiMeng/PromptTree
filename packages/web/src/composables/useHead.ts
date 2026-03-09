import { watchEffect, type Ref, onUnmounted, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  SUPPORTED_LOCALES,
  OG_LOCALE_MAP,
  HTML_LANG_MAP,
  extractLocaleFromPath,
  getLocalePath,
  isNonLocalePath,
  stripLocalePath,
  type SupportedLocale
} from '@/utils/locale'

const SITE_NAME = 'PromptTree'
const SITE_URL = 'https://prompttree.app'
const DEFAULT_ROBOTS = 'index, follow'

interface HeadOptions {
  /** 页面标题（会自动追加站点名） */
  title?: string | Ref<string>
  /** 页面描述 */
  description?: string | Ref<string>
  /** robots 策略，如 noindex, nofollow */
  robots?: string | Ref<string>
}

/**
 * 动态管理页面 <title>、canonical、robots、html lang、hreflang、OG 标签
 * 路由切换时自动更新，组件卸载时恢复默认值
 */
export function useHead(options: HeadOptions = {}) {
  const originalTitle = document.title
  const { locale, t } = useI18n()
  const route = useRoute()

  watchEffect(() => {
    const currentLocale = locale.value as SupportedLocale
    const defaultDescription = t('seo.siteDesc')

    // 标题
    const title = unref(options.title)
    if (title) {
      document.title = `${title} - ${SITE_NAME}`
    } else {
      document.title = `${SITE_NAME} — ${defaultDescription}`
    }

    // Meta description
    const description = unref(options.description)
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', description || defaultDescription)
    }

    // html lang
    document.documentElement.setAttribute('lang', HTML_LANG_MAP[currentLocale] || currentLocale)

    // OG locale
    _setMetaProperty('og:locale', OG_LOCALE_MAP[currentLocale] || 'en_US')

    const currentPath = _normalizePath(route.path)
    const canonicalUrl = `${SITE_URL}${currentPath}`

    // Canonical URL — path-only，避免 query/hash 干扰规范化
    _setLinkTag('canonical', canonicalUrl)

    // robots
    const robots = unref(options.robots)
    _setMetaName('robots', robots || DEFAULT_ROBOTS)

    // OG URL
    _setMetaProperty('og:url', canonicalUrl)

    // OG title & description
    _setMetaProperty('og:title', title ? `${title} - ${SITE_NAME}` : document.title)
    _setMetaProperty('og:description', description || defaultDescription)

    // Twitter Card
    _setMetaName('twitter:title', title ? `${title} - ${SITE_NAME}` : document.title)
    _setMetaName('twitter:description', description || defaultDescription)

    // Hreflang 标签 — 为所有支持的语言生成
    _updateHreflangTags(currentPath)
  })

  onUnmounted(() => {
    document.title = originalTitle
  })
}

// =================== 内部工具函数 ===================

function _setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function _setMetaName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function _setLinkTag(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function _normalizePath(path: string): string {
  if (!path) return '/'
  const withoutHash = path.split('#')[0]
  const withoutQuery = withoutHash.split('?')[0]
  if (!withoutQuery) return '/'
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`
}

/**
 * 更新 hreflang 标签：为每种支持的语言 + x-default 生成 alternate link
 */
function _updateHreflangTags(currentPath: string) {
  // 先移除旧的 hreflang 标签
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove())

  if (isNonLocalePath(currentPath) || !extractLocaleFromPath(currentPath)) {
    return
  }

  // 获取不含 locale 前缀的路径
  const basePath = stripLocalePath(currentPath)

  // 为每种语言生成 hreflang
  for (const loc of SUPPORTED_LOCALES) {
    const localePath = getLocalePath(basePath, loc)
    const link = document.createElement('link')
    link.setAttribute('rel', 'alternate')
    link.setAttribute('hreflang', HTML_LANG_MAP[loc])
    link.setAttribute('href', `${SITE_URL}${localePath}`)
    document.head.appendChild(link)
  }

  // x-default 指向英文版本
  const defaultLink = document.createElement('link')
  defaultLink.setAttribute('rel', 'alternate')
  defaultLink.setAttribute('hreflang', 'x-default')
  defaultLink.setAttribute('href', `${SITE_URL}${getLocalePath(basePath, 'en')}`)
  document.head.appendChild(defaultLink)
}
