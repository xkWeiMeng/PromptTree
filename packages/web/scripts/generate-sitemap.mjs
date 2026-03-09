import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_URL = 'https://prompttree.app'
const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko']
const HREFLANG_MAP = {
  'en': 'en',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'ja': 'ja',
  'ko': 'ko'
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const WEB_ROOT = path.resolve(__dirname, '..')
const CONTENT_ROOT = path.join(WEB_ROOT, 'src', 'content')
const OUTPUT_PATH = path.join(WEB_ROOT, 'public', 'sitemap.xml')
const LANDING_VIEW_PATH = path.join(WEB_ROOT, 'src', 'views', 'LandingPage.vue')
const FEATURES_VIEW_PATH = path.join(WEB_ROOT, 'src', 'views', 'FeaturesPage.vue')
const DOCS_VIEW_PATH = path.join(WEB_ROOT, 'src', 'views', 'DocsPage.vue')
const BLOG_VIEW_PATH = path.join(WEB_ROOT, 'src', 'views', 'BlogPage.vue')

function formatLastmod(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function maxLastmod(...dates) {
  const valid = dates.filter(Boolean)
  if (valid.length === 0) return null
  return valid.reduce((max, current) => (current > max ? current : max))
}

function isSupportedLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale)
}

function sortLocales(locales) {
  return [...locales].sort((a, b) => SUPPORTED_LOCALES.indexOf(a) - SUPPORTED_LOCALES.indexOf(b))
}

async function getFileLastmod(filePath) {
  try {
    const stat = await fs.stat(filePath)
    return formatLastmod(stat.mtime)
  } catch {
    return null
  }
}

function withLocale(basePath, locale) {
  return basePath === '/' ? `/${locale}` : `/${locale}${basePath}`
}

function escapeXml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

async function getLocalizedContent(contentType) {
  const typeDir = path.join(CONTENT_ROOT, contentType)
  const records = []

  let localeDirs = []
  try {
    const entries = await fs.readdir(typeDir, { withFileTypes: true })
    localeDirs = entries
      .filter((entry) => entry.isDirectory() && isSupportedLocale(entry.name))
      .map((entry) => entry.name)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return []
    }
    throw error
  }

  for (const localeDir of localeDirs) {
    const localePath = path.join(typeDir, localeDir)
    const entries = await fs.readdir(localePath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const sourcePath = path.join(localePath, entry.name)
      const stat = await fs.stat(sourcePath)
      records.push({
        locale: localeDir,
        slug: entry.name.replace(/\.md$/, ''),
        lastmod: formatLastmod(stat.mtime)
      })
    }
  }

  return records
}

function buildLastmodByLocale(records) {
  const byLocale = new Map()
  for (const record of records) {
    const current = byLocale.get(record.locale)
    byLocale.set(record.locale, maxLastmod(current, record.lastmod))
  }
  return byLocale
}

function buildLocalesBySlug(records) {
  const bySlug = new Map()
  for (const record of records) {
    if (!bySlug.has(record.slug)) {
      bySlug.set(record.slug, new Set())
    }
    bySlug.get(record.slug).add(record.locale)
  }
  return bySlug
}

function buildRecordMap(records) {
  return new Map(records.map((record) => [`${record.locale}:${record.slug}`, record]))
}

function renderAlternates(basePath, alternateLocales) {
  const links = alternateLocales.map((locale) => {
    const href = `${SITE_URL}${withLocale(basePath, locale)}`
    return `    <xhtml:link rel="alternate" hreflang="${HREFLANG_MAP[locale]}" href="${escapeXml(href)}" />`
  })

  const defaultLocale = alternateLocales.includes('en') ? 'en' : alternateLocales[0]
  links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}${withLocale(basePath, defaultLocale)}`)}" />`)

  return links.join('\n')
}

function renderUrl(entry) {
  const loc = `${SITE_URL}${withLocale(entry.basePath, entry.locale)}`
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${entry.lastmod}</lastmod>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    renderAlternates(entry.basePath, entry.alternateLocales),
    '  </url>'
  ].join('\n')
}

async function main() {
  const [landingLastmod, featuresLastmod, docsViewLastmod, blogViewLastmod, docsRecords, blogRecords] = await Promise.all([
    getFileLastmod(LANDING_VIEW_PATH),
    getFileLastmod(FEATURES_VIEW_PATH),
    getFileLastmod(DOCS_VIEW_PATH),
    getFileLastmod(BLOG_VIEW_PATH),
    getLocalizedContent('docs'),
    getLocalizedContent('blog')
  ])

  const today = formatLastmod(new Date())
  const rootLastmod = landingLastmod || today
  const featureLastmod = featuresLastmod || today

  const docsLocales = sortLocales(new Set(docsRecords.map((record) => record.locale)))
  const blogLocales = sortLocales(new Set(blogRecords.map((record) => record.locale)))

  const docsLastmodByLocale = buildLastmodByLocale(docsRecords)
  const blogLastmodByLocale = buildLastmodByLocale(blogRecords)
  const docsLocalesBySlug = buildLocalesBySlug(docsRecords)
  const blogLocalesBySlug = buildLocalesBySlug(blogRecords)
  const docsRecordMap = buildRecordMap(docsRecords)
  const blogRecordMap = buildRecordMap(blogRecords)

  const entries = [
    ...SUPPORTED_LOCALES.map((locale) => ({
      locale,
      basePath: '/',
      lastmod: rootLastmod,
      changefreq: 'weekly',
      priority: '1.0',
      alternateLocales: SUPPORTED_LOCALES
    })),
    ...SUPPORTED_LOCALES.map((locale) => ({
      locale,
      basePath: '/features',
      lastmod: featureLastmod,
      changefreq: 'monthly',
      priority: '0.9',
      alternateLocales: SUPPORTED_LOCALES
    })),
    ...docsLocales.map((locale) => ({
      locale,
      basePath: '/docs',
      lastmod: maxLastmod(docsViewLastmod, docsLastmodByLocale.get(locale)) || docsViewLastmod || today,
      changefreq: 'weekly',
      priority: '0.8',
      alternateLocales: docsLocales
    })),
    ...[...docsLocalesBySlug.keys()].sort((a, b) => a.localeCompare(b)).flatMap((slug) => {
      const alternateLocales = sortLocales(docsLocalesBySlug.get(slug))
      return alternateLocales.map((locale) => ({
        locale,
        basePath: `/docs/${slug}`,
        lastmod: docsRecordMap.get(`${locale}:${slug}`)?.lastmod || today,
        changefreq: 'monthly',
        priority: '0.7',
        alternateLocales
      }))
    }),
    ...blogLocales.map((locale) => ({
      locale,
      basePath: '/blog',
      lastmod: maxLastmod(blogViewLastmod, blogLastmodByLocale.get(locale)) || blogViewLastmod || today,
      changefreq: 'weekly',
      priority: '0.8',
      alternateLocales: blogLocales
    })),
    ...[...blogLocalesBySlug.keys()].sort((a, b) => a.localeCompare(b)).flatMap((slug) => {
      const alternateLocales = sortLocales(blogLocalesBySlug.get(slug))
      return alternateLocales.map((locale) => ({
        locale,
        basePath: `/blog/${slug}`,
        lastmod: blogRecordMap.get(`${locale}:${slug}`)?.lastmod || today,
        changefreq: 'yearly',
        priority: '0.7',
        alternateLocales
      }))
    })
  ]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(renderUrl),
    '</urlset>',
    ''
  ].join('\n')

  await fs.writeFile(OUTPUT_PATH, xml, 'utf-8')
  console.log(`[sitemap] generated ${entries.length} URLs at ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error('[sitemap] failed to generate sitemap')
  console.error(error)
  process.exitCode = 1
})
