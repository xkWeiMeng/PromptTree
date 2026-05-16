import { watchEffect, onUnmounted, type Ref, unref } from 'vue'

const SCRIPT_ID_PREFIX = 'jsonld-'

/**
 * 向页面注入 JSON-LD 结构化数据
 * 支持 reactive 数据源，组件卸载时自动移除
 */
export function useJsonLd(id: string, data: Record<string, unknown> | Ref<Record<string, unknown>>) {
  const scriptId = `${SCRIPT_ID_PREFIX}${id}`

  watchEffect(() => {
    const resolved = unref(data)
    if (!resolved || Object.keys(resolved).length === 0) return

    let el = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!el) {
      el = document.createElement('script')
      el.id = scriptId
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(resolved)
  })

  onUnmounted(() => {
    const el = document.getElementById(scriptId)
    if (el) el.remove()
  })
}

// =================== Schema Builders ===================

const SITE_NAME = 'PromptTree'
const SITE_URL = 'https://prompttree.app'

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'A tree-structured prompt management tool with variable filling, offline-first design, and cloud sync.',
  }
}

export function buildProductSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }
}

export interface ArticleSchemaOptions {
  headline: string
  description?: string
  url: string
  datePublished?: string
  dateModified?: string
  author?: string
  image?: string
}

export function buildArticleSchema(options: ArticleSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.headline,
    ...(options.description && { description: options.description }),
    url: options.url,
    ...(options.datePublished && { datePublished: options.datePublished }),
    ...(options.dateModified && { dateModified: options.dateModified || options.datePublished }),
    ...(options.author && {
      author: {
        '@type': 'Person',
        name: options.author,
      },
    }),
    ...(options.image && { image: options.image }),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
