<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@/composables'
import { useJsonLd, buildArticleSchema, buildBreadcrumbSchema } from '@/composables'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteLayout from '@/components/site/SiteLayout.vue'
import MarkdownRenderer from '@/components/site/MarkdownRenderer.vue'
import { getPostBySlug, getAllPosts } from '@/utils/content'
import { ArrowLeft, ChevronRight } from 'lucide-vue-next'

const SITE_URL = 'https://prompttree.app'

const { t, locale } = useI18n()
const { localePath } = useLocalePath()
const route = useRoute()
const slug = computed(() => route.params.slug as string)
const post = computed(() => getPostBySlug(slug.value, locale.value))

// 相关文章（同标签，排除当前）
const relatedPosts = computed(() => {
  if (!post.value) return []
  const tags = post.value.meta.tags
  return getAllPosts(locale.value)
    .filter(p => p.meta.slug !== slug.value && p.meta.tags.some(t => tags.includes(t)))
    .slice(0, 3)
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(locale.value, { year: 'numeric', month: 'long', day: 'numeric' })
}

// TOC — 从 markdown 提取 h2/h3 标题
interface TocItem {
  level: number
  text: string
  id: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const toc = computed<TocItem[]>(() => {
  if (!post.value) return []
  const lines = post.value.content.split('\n')
  const items: TocItem[] = []
  for (const line of lines) {
    const m2 = line.match(/^## (.+)$/)
    if (m2) {
      items.push({ level: 2, text: m2[1], id: slugify(m2[1]) })
      continue
    }
    const m3 = line.match(/^### (.+)$/)
    if (m3) {
      items.push({ level: 3, text: m3[1], id: slugify(m3[1]) })
    }
  }
  return items
})

// Author avatar initial
const authorInitial = computed(() => {
  if (!post.value?.meta.author) return '?'
  return post.value.meta.author.charAt(0).toUpperCase()
})

// SEO
const pageTitle = computed(() => post.value ? post.value.meta.title : t('blog.pageTitle'))
const pageDesc = computed(() => post.value?.meta.description || '')
useHead({ title: pageTitle, description: pageDesc, ogType: 'article' })

// JSON-LD: Article
const articleSchema = computed(() => {
  if (!post.value) return {}
  return buildArticleSchema({
    headline: post.value.meta.title,
    description: post.value.meta.description,
    url: `${SITE_URL}${route.path}`,
    datePublished: post.value.meta.date,
    author: post.value.meta.author,
  })
})
useJsonLd('article', articleSchema)

// JSON-LD: Breadcrumb
const breadcrumbSchema = computed(() => {
  if (!post.value) return {}
  return buildBreadcrumbSchema([
    { name: t('breadcrumb.home'), url: SITE_URL },
    { name: t('breadcrumb.blog'), url: `${SITE_URL}${localePath('/blog')}` },
    { name: post.value.meta.title, url: `${SITE_URL}${route.path}` },
  ])
})
useJsonLd('breadcrumb', breadcrumbSchema)
</script>

<template>
  <SiteLayout>
    <template v-if="post">
      <!-- 面包屑导航 -->
      <div class="blog-post__header">
        <div class="site-container">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <ol class="breadcrumb__list">
              <li class="breadcrumb__item">
                <RouterLink :to="localePath('/')" class="breadcrumb__link">{{ t('breadcrumb.home') }}</RouterLink>
                <ChevronRight :size="14" class="breadcrumb__separator" />
              </li>
              <li class="breadcrumb__item">
                <RouterLink :to="localePath('/blog')" class="breadcrumb__link">{{ t('breadcrumb.blog') }}</RouterLink>
                <ChevronRight :size="14" class="breadcrumb__separator" />
              </li>
              <li class="breadcrumb__item breadcrumb__item--current" aria-current="page">
                {{ post.meta.title }}
              </li>
            </ol>
          </nav>

          <h1 class="blog-post__title">{{ post.meta.title }}</h1>

          <!-- 作者信息卡片 -->
          <div class="author-card">
            <div class="author-card__avatar">{{ authorInitial }}</div>
            <div class="author-card__info">
              <span class="author-card__name">{{ post.meta.author }}</span>
              <span class="author-card__date">{{ t('blog.publishedOn', { date: formatDate(post.meta.date) }) }}</span>
            </div>
          </div>

          <div v-if="post.meta.tags.length" class="blog-post__tags">
            <span v-for="tag in post.meta.tags" :key="tag" class="blog-card__tag">{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- 文章内容 + TOC -->
      <div class="site-container site-container--narrow blog-post__body">
        <!-- 目录 -->
        <details v-if="toc.length > 0" class="toc" open>
          <summary class="toc__title">{{ t('blog.tableOfContents') }}</summary>
          <nav class="toc__nav">
            <a
              v-for="item in toc"
              :key="item.id"
              :href="`#${item.id}`"
              class="toc__link"
              :class="{ 'toc__link--h3': item.level === 3 }"
            >
              {{ item.text }}
            </a>
          </nav>
        </details>

        <MarkdownRenderer :content="post.content" />

        <!-- 相关文章 -->
        <div v-if="relatedPosts.length" class="related-posts">
          <h3 class="related-posts__title">{{ t('blog.relatedPosts') }}</h3>
          <div class="related-posts__list">
            <RouterLink
              v-for="rp in relatedPosts"
              :key="rp.meta.slug"
              :to="localePath(`/blog/${rp.meta.slug}`)"
              class="related-posts__item"
            >
              <span class="related-posts__item-title">{{ rp.meta.title }}</span>
              <span class="related-posts__item-date">{{ formatDate(rp.meta.date) }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="blog-post__not-found">
        <p>{{ t('blog.notFound') }}</p>
        <RouterLink :to="localePath('/blog')" class="blog-post__not-found-link" :aria-label="t('blog.backToList')">{{ t('blog.backToList') }}</RouterLink>
      </div>
    </template>
  </SiteLayout>
</template>

<style scoped>
/* =================== Breadcrumb =================== */
.breadcrumb {
  margin-bottom: var(--space-6);
}

.breadcrumb__list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.breadcrumb__item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
}

.breadcrumb__link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--duration-fast) ease;
}

.breadcrumb__link:hover {
  color: var(--color-accent);
  text-decoration: none;
}

.breadcrumb__link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.breadcrumb__separator {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.breadcrumb__item--current {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

/* =================== Author Card =================== */
.author-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.author-card__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.author-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-0);
}

.author-card__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.author-card__date {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* =================== Table of Contents =================== */
.toc {
  margin-bottom: var(--space-8);
  padding: var(--space-4) var(--space-5);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 0.5px solid var(--border-secondary);
}

.toc__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
  list-style: none;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.toc__title::before {
  content: '▸';
  font-size: var(--font-size-xs);
  transition: transform var(--duration-fast) ease;
}

.toc[open] > .toc__title::before {
  transform: rotate(90deg);
}

.toc__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-3);
}

.toc__link {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;
  padding: var(--space-1) 0;
  transition: color var(--duration-fast) ease;
}

.toc__link:hover {
  color: var(--color-accent);
  text-decoration: none;
}

.toc__link--h3 {
  padding-left: var(--space-4);
  font-size: var(--font-size-xs);
}

/* =================== Existing styles =================== */
.blog-post__body {
  padding-bottom: var(--space-16);
}

.blog-post__title {
  text-wrap: balance;
}

.blog-post__tags {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.blog-post__not-found {
  text-align: center;
  padding: calc(var(--site-header-height) + var(--space-20)) 0 var(--space-20);
  color: var(--text-tertiary);
}

.blog-post__not-found-link {
  margin-top: var(--space-4);
  display: inline-block;
}

.related-posts {
  margin-top: var(--space-16);
  padding-top: var(--space-8);
  border-top: 0.5px solid var(--border-secondary);
}

.related-posts__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.related-posts__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.related-posts__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background var(--duration-fast) ease;
}

.related-posts__item:hover {
  background: var(--bg-quaternary);
  text-decoration: none;
}

.related-posts__item:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.related-posts__item-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.related-posts__item-date {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* Mobile */
@media (max-width: 640px) {
  .blog-post__body {
    padding-bottom: var(--space-10);
  }

  .blog-post__not-found {
    padding: calc(var(--site-header-height) + var(--space-12)) 0 var(--space-12);
  }

  .related-posts {
    margin-top: var(--space-10);
  }

  .related-posts__item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }

  .breadcrumb__item--current {
    max-width: 160px;
  }

  .author-card {
    padding: var(--space-3);
  }
}
</style>
