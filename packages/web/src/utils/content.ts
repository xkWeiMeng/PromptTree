/**
 * Markdown 内容加载与解析工具
 * - 手动解析 frontmatter（浏览器端，无需 gray-matter）
 * - 类型定义
 */

// =================== Types ===================

export interface DocMeta {
  slug: string
  title: string
  description: string
  order: number
}

export interface BlogMeta {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  author: string
}

export interface ContentItem<T> {
  meta: T
  content: string
}

// =================== Frontmatter 解析 ===================

/**
 * 解析 Markdown 文件的 frontmatter（YAML 简易解析）
 * 支持基础类型：string, number, string[] (逗号分隔)
 */
export function parseFrontmatter(raw: string): { meta: Record<string, string | number | string[]>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    return { meta: {}, content: raw }
  }

  const yamlStr = match[1]
  const content = match[2]
  const meta: Record<string, string | number | string[]> = {}

  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()

    // 去除引号
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // 检测数组（逗号分隔，如 tags: AI, Prompt, 效率）
    if (key === 'tags') {
      meta[key] = value.split(',').map(s => s.trim()).filter(Boolean)
    } else if (key === 'order' && !isNaN(Number(value))) {
      meta[key] = Number(value)
    } else {
      meta[key] = value
    }
  }

  return { meta, content }
}

// =================== Content Loading ===================

// 使用 Vite 的 import.meta.glob 加载 Markdown 文件（raw string）
// 使用 **/*.md 匹配所有 locale 子目录
const docModules = import.meta.glob<string>('/src/content/docs/**/*.md', { query: '?raw', import: 'default', eager: true })
const blogModules = import.meta.glob<string>('/src/content/blog/**/*.md', { query: '?raw', import: 'default', eager: true })

/**
 * 根据当前 locale 构建 fallback 链
 * 中文变体之间互相 fallback，其他语言直接 fallback 到 en
 */
function getFallbackChain(locale: string): string[] {
  if (locale === 'zh-CN') return ['en']
  if (locale === 'zh-TW') return ['zh-CN', 'en']
  return ['en']
}

/**
 * 从 glob 模块中按 locale 筛选条目
 * 路径格式: /src/content/{type}/{locale}/{slug}.md
 * fallback: 如果目标 locale 不存在，按 getFallbackChain 顺序补充
 */
function getModulesByLocale(
  modules: Record<string, string>,
  contentType: 'docs' | 'blog',
  locale: string
): Record<string, string> {
  const prefix = `/src/content/${contentType}/`
  const localePrefix = `${prefix}${locale}/`

  // 收集目标 locale 的文件
  const result: Record<string, string> = {}
  const slugsFound = new Set<string>()

  for (const [path, raw] of Object.entries(modules)) {
    if (path.startsWith(localePrefix)) {
      const slug = path.split('/').pop()!.replace('.md', '')
      result[path] = raw
      slugsFound.add(slug)
    }
  }

  // Fallback: 对未找到的 slug，从 fallback 链中补充
  for (const fallbackLocale of getFallbackChain(locale)) {
    if (fallbackLocale === locale) continue
    const fallbackPrefix = `${prefix}${fallbackLocale}/`
    for (const [path, raw] of Object.entries(modules)) {
      if (path.startsWith(fallbackPrefix)) {
        const slug = path.split('/').pop()!.replace('.md', '')
        if (!slugsFound.has(slug)) {
          result[path] = raw
          slugsFound.add(slug)
        }
      }
    }
  }

  return result
}

/**
 * 获取所有文档列表（按 order 排序）
 * @param locale - 语言代码，如 'en', 'zh-CN'，默认 'zh-CN'
 */
export function getAllDocs(locale: string = 'zh-CN'): ContentItem<DocMeta>[] {
  const docs: ContentItem<DocMeta>[] = []
  const modules = getModulesByLocale(docModules, 'docs', locale)

  for (const [path, raw] of Object.entries(modules)) {
    const slug = path.split('/').pop()!.replace('.md', '')
    const { meta, content } = parseFrontmatter(raw)

    docs.push({
      meta: {
        slug,
        title: (meta.title as string) || slug,
        description: (meta.description as string) || '',
        order: (meta.order as number) || 99,
      },
      content,
    })
  }

  return docs.sort((a, b) => a.meta.order - b.meta.order)
}

/**
 * 根据 slug 获取单篇文档
 * @param slug - 文档 slug
 * @param locale - 语言代码，默认 'zh-CN'
 */
export function getDocBySlug(slug: string, locale: string = 'zh-CN'): ContentItem<DocMeta> | null {
  const docs = getAllDocs(locale)
  return docs.find(d => d.meta.slug === slug) || null
}

/**
 * 获取所有博客文章（按日期倒序）
 * @param locale - 语言代码，默认 'zh-CN'
 */
export function getAllPosts(locale: string = 'zh-CN'): ContentItem<BlogMeta>[] {
  const posts: ContentItem<BlogMeta>[] = []
  const modules = getModulesByLocale(blogModules, 'blog', locale)

  for (const [path, raw] of Object.entries(modules)) {
    const slug = path.split('/').pop()!.replace('.md', '')
    const { meta, content } = parseFrontmatter(raw)

    posts.push({
      meta: {
        slug,
        title: (meta.title as string) || slug,
        date: (meta.date as string) || '',
        description: (meta.description as string) || '',
        tags: (meta.tags as string[]) || [],
        author: (meta.author as string) || 'PromptTree Team',
      },
      content,
    })
  }

  return posts.sort((a, b) => (b.meta.date > a.meta.date ? 1 : -1))
}

/**
 * 根据 slug 获取单篇博客
 * @param slug - 博客 slug
 * @param locale - 语言代码，默认 'zh-CN'
 */
export function getPostBySlug(slug: string, locale: string = 'zh-CN'): ContentItem<BlogMeta> | null {
  const posts = getAllPosts(locale)
  return posts.find(p => p.meta.slug === slug) || null
}
