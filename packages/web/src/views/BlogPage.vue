<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@/composables'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteLayout from '@/components/site/SiteLayout.vue'
import { getAllPosts } from '@/utils/content'

const { t, locale } = useI18n()
const { localePath } = useLocalePath()

useHead({
  title: t('blog.pageTitle'),
  description: t('blog.metaDesc')
})

const posts = computed(() => getAllPosts(locale.value))

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
}
</style>
