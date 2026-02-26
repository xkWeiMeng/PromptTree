<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@/composables'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteLayout from '@/components/site/SiteLayout.vue'
import MarkdownRenderer from '@/components/site/MarkdownRenderer.vue'
import { getDocBySlug, getAllDocs } from '@/utils/content'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { t, locale } = useI18n()
const { localePath } = useLocalePath()
const route = useRoute()
const slug = computed(() => route.params.slug as string)
const doc = computed(() => getDocBySlug(slug.value, locale.value))
const allDocs = computed(() => getAllDocs(locale.value))

// 前后导航
const currentIndex = computed(() => allDocs.value.findIndex(d => d.meta.slug === slug.value))
const prevDoc = computed(() => currentIndex.value > 0 ? allDocs.value[currentIndex.value - 1] : null)
const nextDoc = computed(() => currentIndex.value < allDocs.value.length - 1 ? allDocs.value[currentIndex.value + 1] : null)

// SEO
const pageTitle = computed(() => doc.value ? `${doc.value.meta.title} - ${t('docs.docMetaSuffix')}` : t('docs.pageTitle'))
const pageDesc = computed(() => doc.value?.meta.description || '')
useHead({ title: pageTitle, description: pageDesc })
</script>

<template>
  <SiteLayout>
    <div class="docs-layout">
      <!-- 侧边栏 -->
      <aside class="docs-sidebar">
        <div class="docs-sidebar__title">{{ t('docs.sidebarTitle') }}</div>
        <nav class="docs-sidebar__list">
          <RouterLink
            v-for="d in allDocs"
            :key="d.meta.slug"
            :to="localePath(`/docs/${d.meta.slug}`)"
            class="docs-sidebar__link"
            :class="{ 'docs-sidebar__link--active': d.meta.slug === slug }"
          >
            {{ d.meta.title }}
          </RouterLink>
        </nav>
      </aside>

      <!-- 内容 -->
      <div class="docs-content">
        <template v-if="doc">
          <h1 style="font-size: var(--font-size-h2); font-weight: var(--font-weight-bold); margin-bottom: var(--space-6); letter-spacing: var(--letter-spacing-tight);">
            {{ doc.meta.title }}
          </h1>
          <MarkdownRenderer :content="doc.content" />

          <!-- 前后导航 -->
          <div class="doc-nav">
            <RouterLink v-if="prevDoc" :to="localePath(`/docs/${prevDoc.meta.slug}`)" class="doc-nav__link doc-nav__link--prev">
              <ChevronLeft :size="16" />
              <span>{{ prevDoc.meta.title }}</span>
            </RouterLink>
            <div v-else />
            <RouterLink v-if="nextDoc" :to="localePath(`/docs/${nextDoc.meta.slug}`)" class="doc-nav__link doc-nav__link--next">
              <span>{{ nextDoc.meta.title }}</span>
              <ChevronRight :size="16" />
            </RouterLink>
          </div>
        </template>

        <template v-else>
          <div style="text-align: center; padding: var(--space-20) 0; color: var(--text-tertiary);">
            <p>{{ t('docs.notFound') }}</p>
            <RouterLink :to="localePath('/docs')" style="margin-top: var(--space-4); display: inline-block;">{{ t('docs.backToList') }}</RouterLink>
          </div>
        </template>
      </div>
    </div>
  </SiteLayout>
</template>

<style scoped>
.doc-nav {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-12);
  padding-top: var(--space-6);
  border-top: 0.5px solid var(--border-secondary);
  gap: var(--space-4);
}

.doc-nav__link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: background var(--duration-fast) ease;
}

.doc-nav__link:hover {
  background: var(--bg-quaternary);
  text-decoration: none;
}

.doc-nav__link--next {
  margin-left: auto;
}
</style>
