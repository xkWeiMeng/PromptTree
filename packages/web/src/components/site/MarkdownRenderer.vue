<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps<{
  content: string
}>()

/**
 * Markdown 渲染缓存 — 避免对相同内容重复解析
 */
const RENDER_CACHE_MAX = 50
const renderCache = new Map<string, string>()

/**
 * 简易 Markdown → HTML 转换器
 * 支持: h1-h4, p, ul/ol, code, pre, blockquote, strong, em, a, hr, table
 * 无需外部依赖
 */
function renderMarkdown(md: string): string {
  const cached = renderCache.get(md)
  if (cached !== undefined) return cached

  let html = md

  // 代码块（```...```）
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = escapeHtml(code.trim())
    return `<pre><code class="language-${lang}">${escaped}</code></pre>`
  })

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // 表格
  html = html.replace(/^(\|.+\|)\r?\n(\|[-:| ]+\|)\r?\n((?:\|.+\|\r?\n?)+)/gm, (_m, header, _sep, body) => {
    const ths = header.split('|').filter(Boolean).map((c: string) => `<th scope="col">${c.trim()}</th>`).join('')
    const rows = body.trim().split('\n').map((row: string) => {
      const tds = row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('')
      return `<tr>${tds}</tr>`
    }).join('')
    return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`
  })

  // 标题 — 添加 id 属性用于锚点链接
  html = html.replace(/^#### (.+)$/gm, (_m, text) => `<h4 id="${slugify(text)}">${text}</h4>`)
  html = html.replace(/^### (.+)$/gm, (_m, text) => `<h3 id="${slugify(text)}">${text}</h3>`)
  html = html.replace(/^## (.+)$/gm, (_m, text) => `<h2 id="${slugify(text)}">${text}</h2>`)
  html = html.replace(/^# (.+)$/gm, (_m, text) => `<h1 id="${slugify(text)}">${text}</h1>`)

  // 引用
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')

  // 水平线
  html = html.replace(/^---$/gm, '<hr>')

  // 无序列表
  html = html.replace(/^(?:- (.+)\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^- /, '')
      return `<li>${content}</li>`
    }).join('')
    return `<ul>${items}</ul>`
  })

  // 有序列表
  html = html.replace(/^(?:\d+\. (.+)\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^\d+\. /, '')
      return `<li>${content}</li>`
    }).join('')
    return `<ol>${items}</ol>`
  })

  // 粗体 & 斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')

  // 段落：将连续非标签行包裹为 <p>
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>')

  // 清理多余空行产生的空 <p>
  html = html.replace(/<p>\s*<\/p>/g, '')

  // 存入缓存，超限时淘汰最早条目
  if (renderCache.size >= RENDER_CACHE_MAX) {
    const firstKey = renderCache.keys().next().value!
    renderCache.delete(firstKey)
  }
  renderCache.set(md, html)

  return html
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const rendered = computed(() =>
  DOMPurify.sanitize(renderMarkdown(props.content), {
    ADD_ATTR: ['target', 'rel', 'loading', 'id'],
    ADD_TAGS: ['img'],
  })
)
</script>

<template>
  <div class="markdown-body" v-html="rendered" />
</template>
