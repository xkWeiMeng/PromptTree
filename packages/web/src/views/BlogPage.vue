<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@/composables'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteLayout from '@/components/site/SiteLayout.vue'
import { getAllPosts } from '@/utils/content'

const { t, locale } = useI18n()
const { localePath } = useLocalePath()
const route = useRoute()
const router = useRouter()

useHead({
  title: t('blog.pageTitle'),
  description: t('blog.metaDesc')
})

const POSTS_PER_PAGE = 6

const allPosts = computed(() => getAllPosts(locale.value))

const currentPage = computed(() => {
  const p = Number(route.query.page) || 1
  return Math.max(1, p)
})

const totalPages = computed(() => Math.max(1, Math.ceil(allPosts.value.length / POSTS_PER_PAGE)))

const posts = computed(() => {
  const start = (currentPage.value - 1) * POSTS_PER_PAGE
  return allPosts.value.slice(start, start + POSTS_PER_PAGE)
})

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  router.push({ query: page === 1 ? {} : { page: String(page) } })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(locale.value, { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <SiteLayout>
    <section class="page-header">
      <div class="site-container">
        <h1 class="page-header__title">{{ t('blog.pageTitle') }}</h1>
        <p class="page-header__desc">
          {{ t('blog.pageDesc') }}
        </p>
      </div>
    </section>

    <div class="site-container blog-page__body">
      <div class="blog-grid">
        <RouterLink
          v-for="post in posts"
          :key="post.meta.slug"
          :to="localePath(`/blog/${post.meta.slug}`)"
          class="blog-card"
        >
          <span class="blog-card__date">{{ formatDate(post.meta.date) }}</span>
          <h3 class="blog-card__title">{{ post.meta.title }}</h3>
          <p class="blog-card__desc">{{ post.meta.description }}</p>
          <div v-if="post.meta.tags.length" class="blog-card__tags">
            <span v-for="tag in post.meta.tags" :key="tag" class="blog-card__tag">{{ tag }}</span>
          </div>
        </RouterLink>
      </div>

      <div v-if="!posts.length" class="blog-page__empty">
        <p>{{ t('blog.noPosts') }}</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="blog-pagination">
        <button
          class="pagination-btn"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          {{ t('blog.previousPage') }}
        </button>
        <span class="pagination-info">{{ t('blog.pageOf', { current: currentPage, total: totalPages }) }}</span>
        <button
          class="pagination-btn"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          {{ t('blog.nextPage') }}
        </button>
      </div>
    </div>
  </SiteLayout>
</template>

<style scoped>
.blog-page__body {
  padding-bottom: var(--space-20);
}

.blog-page__empty {
  text-align: center;
  padding: var(--space-20) 0;
  color: var(--text-tertiary);
}

/* Typography */
.page-header__title {
  text-wrap: balance;
}

/* Mobile */
@media (max-width: 640px) {
  .blog-page__body {
    padding-bottom: var(--space-12);
  }

  .page-header__title {
    font-size: var(--font-size-h3);
  }

  .blog-page__empty {
    padding: var(--space-12) 0;
  }

  .blog-pagination {
    flex-direction: column;
    gap: var(--space-2);
  }
}

/* Pagination */
.blog-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-8) 0 var(--space-4);
}

.pagination-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
