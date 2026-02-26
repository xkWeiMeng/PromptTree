<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@/composables'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteLayout from '@/components/site/SiteLayout.vue'
import MarkdownRenderer from '@/components/site/MarkdownRenderer.vue'
import { getPostBySlug, getAllPosts } from '@/utils/content'
import { ArrowLeft } from 'lucide-vue-next'

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

// SEO
const pageTitle = computed(() => post.value ? post.value.meta.title : t('blog.pageTitle'))
const pageDesc = computed(() => post.value?.meta.description || '')
useHead({ title: pageTitle, description: pageDesc })
</script>

<template>
  <SiteLayout>
    <template v-if="post">
      <!-- 文章头 -->
      <div class="blog-post__header">
        <div class="site-container">
          <RouterLink :to="localePath('/blog')" class="blog-post__back">
            <ArrowLeft :size="16" />
            {{ t('blog.backToBlog') }}
          </RouterLink>
          <h1 class="blog-post__title">{{ post.meta.title }}</h1>
          <div class="blog-post__meta">
            <span>{{ formatDate(post.meta.date) }}</span>
            <span>{{ post.meta.author }}</span>
          </div>
          <div v-if="post.meta.tags.length" class="blog-post__tags">
            <span v-for="tag in post.meta.tags" :key="tag" class="blog-card__tag">{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- 文章内容 -->
      <div class="site-container site-container--narrow" style="padding-bottom: var(--space-16);">
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
      <div style="text-align: center; padding: calc(var(--site-header-height) + var(--space-20)) 0 var(--space-20); color: var(--text-tertiary);">
        <p>{{ t('blog.notFound') }}</p>
        <RouterLink :to="localePath('/blog')" style="margin-top: var(--space-4); display: inline-block;">{{ t('blog.backToList') }}</RouterLink>
      </div>
    </template>
  </SiteLayout>
</template>

<style scoped>
.blog-post__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: var(--space-6);
}

.blog-post__back:hover {
  color: var(--text-primary);
  text-decoration: none;
}

.blog-post__tags {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
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

.related-posts__item-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.related-posts__item-date {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}
</style>
