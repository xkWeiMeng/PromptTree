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
      <!-- Sidebar toggle for mobile -->
      <input id="docs-sidebar-toggle" type="checkbox" class="docs-sidebar__checkbox" aria-hidden="true" />

      <!-- 侧边栏 -->
      <aside class="docs-sidebar">
        <label for="docs-sidebar-toggle" class="docs-sidebar__toggle-label">
          {{ t('docs.sidebarTitle') }}
        </label>
        <div class="docs-sidebar__title docs-sidebar__title--desktop">{{ t('docs.sidebarTitle') }}</div>
        <nav class="docs-sidebar__list" role="navigation" :aria-label="t('docs.sidebarTitle')">
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
          <h1 class="doc-detail__title">
            {{ doc.meta.title }}
          </h1>
          <MarkdownRenderer :content="doc.content" />

          <!-- 前后导航 -->
          <div class="doc-nav">
            <RouterLink
              v-if="prevDoc"
              :to="localePath(`/docs/${prevDoc.meta.slug}`)"
              class="doc-nav__link doc-nav__link--prev"
              :aria-label="`${t('docs.prevDoc')}: ${prevDoc.meta.title}`"
            >
              <ChevronLeft :size="16" />
              <span>{{ prevDoc.meta.title }}</span>
            </RouterLink>
            <div v-else />
            <RouterLink
              v-if="nextDoc"
              :to="localePath(`/docs/${nextDoc.meta.slug}`)"
              class="doc-nav__link doc-nav__link--next"
              :aria-label="`${t('docs.nextDoc')}: ${nextDoc.meta.title}`"
            >
              <span>{{ nextDoc.meta.title }}</span>
              <ChevronRight :size="16" />
            </RouterLink>
          </div>
        </template>

        <template v-else>
          <div class="doc-detail__not-found">
            <p>{{ t('docs.notFound') }}</p>
            <RouterLink :to="localePath('/docs')" class="doc-detail__not-found-link" :aria-label="t('docs.backToList')">{{ t('docs.backToList') }}</RouterLink>
          </div>
        </template>
      </div>
    </div>
  </SiteLayout>
</template>

<style scoped>
/* Title */
.doc-detail__title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-6);
  letter-spacing: var(--letter-spacing-tight);
  text-wrap: balance;
}

/* Not-found state */
.doc-detail__not-found {
  text-align: center;
  padding: var(--space-20) 0;
  color: var(--text-tertiary);
}

.doc-detail__not-found-link {
  margin-top: var(--space-4);
  display: inline-block;
}

/* Sidebar collapsible checkbox (hidden) */
.docs-sidebar__checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

/* Mobile toggle label (hidden on desktop) */
.docs-sidebar__toggle-label {
  display: none;
}

/* Desktop sidebar title (hidden on mobile when toggle visible) */
.docs-sidebar__title--desktop {
  display: block;
}

/* Navigation */
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

.doc-nav__link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.doc-nav__link--next {
  margin-left: auto;
}

/* Mobile */
@media (max-width: 640px) {
  .doc-detail__title {
    font-size: var(--font-size-h3);
  }

  .doc-detail__not-found {
    padding: var(--space-12) 0;
  }

  /* Collapsible sidebar via checkbox hack */
  .docs-sidebar__title--desktop {
    display: none;
  }

  .docs-sidebar__toggle-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    cursor: pointer;
    padding: var(--space-2) 0;
    user-select: none;
  }

  .docs-sidebar__toggle-label::after {
    content: '▸';
    transition: transform var(--duration-fast) ease;
  }

  .docs-sidebar__checkbox:checked ~ .docs-sidebar .docs-sidebar__toggle-label::after {
    transform: rotate(90deg);
  }

  .docs-sidebar__list {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--duration-normal) ease;
  }

  .docs-sidebar__checkbox:checked ~ .docs-sidebar .docs-sidebar__list {
    max-height: 60vh;
  }

  /* Nav buttons stack vertically */
  .doc-nav {
    flex-direction: column;
    gap: var(--space-2);
  }

  .doc-nav__link--next {
    margin-left: 0;
  }
}
</style>
