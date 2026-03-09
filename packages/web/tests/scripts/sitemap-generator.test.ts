import { execFile } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const webRoot = path.resolve(__dirname, '../..')
const scriptPath = path.join(webRoot, 'scripts', 'generate-sitemap.mjs')
const sitemapPath = path.join(webRoot, 'public', 'sitemap.xml')
const docSourcePath = path.join(webRoot, 'src', 'content', 'docs', 'en', 'variables.md')

function getUrlBlock(xml: string, loc: string): string {
  const marker = `<loc>${loc}</loc>`
  const markerIndex = xml.indexOf(marker)
  if (markerIndex === -1) return ''

  const urlStart = xml.lastIndexOf('<url>', markerIndex)
  const urlEnd = xml.indexOf('</url>', markerIndex)
  if (urlStart === -1 || urlEnd === -1) return ''

  return xml.slice(urlStart, urlEnd + '</url>'.length)
}

describe('sitemap generator', () => {
  let xml = ''

  beforeAll(async () => {
    await execFileAsync('node', [scriptPath], { cwd: webRoot })
    xml = await readFile(sitemapPath, 'utf-8')
  })

  it('应该只输出有本地化内容的 docs/blog 列表 URL', () => {
    expect(xml).toContain('<loc>https://prompttree.app/en/docs</loc>')
    expect(xml).toContain('<loc>https://prompttree.app/zh-CN/docs</loc>')
    expect(xml).not.toContain('<loc>https://prompttree.app/zh-TW/docs</loc>')
    expect(xml).not.toContain('<loc>https://prompttree.app/ja/docs</loc>')
    expect(xml).not.toContain('<loc>https://prompttree.app/ko/docs</loc>')

    expect(xml).toContain('<loc>https://prompttree.app/en/blog</loc>')
    expect(xml).toContain('<loc>https://prompttree.app/zh-CN/blog</loc>')
    expect(xml).not.toContain('<loc>https://prompttree.app/zh-TW/blog</loc>')
    expect(xml).not.toContain('<loc>https://prompttree.app/ja/blog</loc>')
    expect(xml).not.toContain('<loc>https://prompttree.app/ko/blog</loc>')
  })

  it('应该为文档详情页仅输出有内容语言的 alternate', () => {
    const block = getUrlBlock(xml, 'https://prompttree.app/en/docs/variables')

    expect(block).toContain('hreflang="en" href="https://prompttree.app/en/docs/variables"')
    expect(block).toContain('hreflang="zh-CN" href="https://prompttree.app/zh-CN/docs/variables"')
    expect(block).toContain('hreflang="x-default" href="https://prompttree.app/en/docs/variables"')
    expect(block).not.toContain('hreflang="zh-TW"')
    expect(block).not.toContain('hreflang="ja"')
    expect(block).not.toContain('hreflang="ko"')
  })

  it('应该为文档详情页使用内容文件更新时间作为 lastmod', async () => {
    const sourceStat = await stat(docSourcePath)
    const expectedLastmod = sourceStat.mtime.toISOString().slice(0, 10)
    const block = getUrlBlock(xml, 'https://prompttree.app/en/docs/variables')

    expect(block).toContain(`<lastmod>${expectedLastmod}</lastmod>`)
  })
})
