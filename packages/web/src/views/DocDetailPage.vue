<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@/composables'
import { useJsonLd, buildArticleSchema, buildBreadcrumbSchema } from '@/composables'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteLayout from '@/components/site/SiteLayout.vue'
import MarkdownRenderer from '@/components/site/MarkdownRenderer.vue'
import { getDocBySlug, getAllDocs } from '@/utils/content'
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-vue-next'

const SITE_URL = 'https://prompttree.app'

const { t, locale } = useI18n()
const { localePath } = useLocalePath()
const route = useRoute()
const slug = computed(() => route.params.slug as string)
const doc = computed(() => getDocBySlug(slug.value, locale.value))
const allDocs = computed(() => getAllDocs(locale.value))

// Mobile sidebar state
const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

// Auto-close sidebar on route change
watch(() => route.path, () => {
  sidebarOpen.value = false
})

// 前后导航
const currentIndex = computed(() => allDocs.value.findIndex(d => d.meta.slug === slug.value))
const prevDoc = computed(() => currentIndex.value > 0 ? allDocs.value[currentIndex.value - 1] : null)
const nextDoc = computed(() => currentIndex.value < allDocs.value.length - 1 ? allDocs.value[currentIndex.value + 1] : null)

// SEO
const pageTitle = computed(() => doc.value ? `${doc.value.meta.title} - ${t('docs.docMetaSuffix')}` : t('docs.pageTitle'))
const pageDesc = computed(() => doc.value?.meta.description || '')
useHead({ title: pageTitle, description: pageDesc, ogType: 'article' })

// JSON-LD: Article
const articleSchema = computed(() => {
  if (!doc.value) return {}
  return buildArticleSchema({
    headline: doc.value.meta.title,
    description: doc.value.meta.description,
    url: `${SITE_URL}${route.path}`,
  })
})
useJsonLd('article', articleSchema)

// JSON-LD: Breadcrumb
const breadcrumbSchema = computed(() => {
  if (!doc.value) return {}
  return buildBreadcrumbSchema([
    { name: t('breadcrumb.home'), url: SITE_URL },
    { name: t('breadcrumb.docs'), url: `${SITE_URL}${localePath('/docs')}` },
    { name: doc.value.meta.title, url: `${SITE_URL}${route.path}` },
  ])
})
useJsonLd('breadcrumb', breadcrumbSchema)
</script>

<template>
  <SiteLayout>
    <div class="docs-layout">
      <!-- 侧边栏 -->
      <aside class="docs-sidebar" :class="{ 'docs-sidebar--open': sidebarOpen }">
        <button
          class="docs-sidebar__toggle"
          :aria-expanded="sidebarOpen"
          :aria-label="sidebarOpen ? t('docs.closeSidebar') : t('docs.openSidebar')"
          @click="toggleSidebar"
        >
          <component :is="sidebarOpen ? X : Menu" :size="18" />
          <span>{{ t('docs.sidebarTitle') }}</span>
        </button>
        <div class="docs-sidebar__title docs-sidebar__title--desktop">{{ t('docs.sidebarTitle') }}</div>
        <Transition name="sidebar-slide">
          <nav
            v-show="sidebarOpen"
            class="docs-sidebar__list docs-sidebar__list--mobile"
            role="navigation"
            :aria-label="t('docs.sidebarTitle')"
          >
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
        </Transition>
        <nav
          class="docs-sidebar__list docs-sidebar__list--desktop"
          role="navigation"
          :aria-label="t('docs.sidebarTitle')"
        >
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
          <!-- 面包屑导航 -->
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <ol class="breadcrumb__list">
              <li class="breadcrumb__item">
                <RouterLink :to="localePath('/')" class="breadcrumb__link">{{ t('breadcrumb.home') }}</RouterLink>
                <ChevronRight :size="14" class="breadcrumb__separator" />
              </li>
              <li class="breadcrumb__item">
                <RouterLink :to="localePath('/docs')" class="breadcrumb__link">{{ t('breadcrumb.docs') }}</RouterLink>
                <ChevronRight :size="14" class="breadcrumb__separator" />
              </li>
              <li class="breadcrumb__item breadcrumb__item--current" aria-current="page">
                {{ doc.meta.title }}
              </li>
            </ol>
          </nav>

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
/* =================== Breadcrumb =================== */
.breadcrumb {
  margin-bottom: var(--space-4);
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

/* =================== Title =================== */
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

/* Sidebar collapsible — hidden toggle on desktop */
.docs-sidebar__toggle {
  display: none;
}

/* Desktop sidebar title */
.docs-sidebar__title--desktop {
  display: block;
}

/* Mobile nav list (shown via Transition) */
.docs-sidebar__list--mobile {
  display: none;
}

/* Desktop nav list (always visible on desktop) */
.docs-sidebar__list--desktop {
  display: flex;
  flex-direction: column;
}

/* Sidebar slide transition */
.sidebar-slide-enter-active {
  transition: max-height var(--duration-normal) ease, opacity var(--duration-normal) ease;
}
.sidebar-slide-leave-active {
  transition: max-height var(--duration-fast) ease, opacity var(--duration-fast) ease;
}
.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.sidebar-slide-enter-to {
  max-height: 60vh;
  opacity: 1;
  overflow: hidden;
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

  /* Show mobile toggle, hide desktop title & list */
  .docs-sidebar__title--desktop {
    display: none;
  }

  .docs-sidebar__list--desktop {
    display: none;
  }

  .docs-sidebar__list--mobile {
    display: flex;
    flex-direction: column;
  }

  .docs-sidebar__toggle {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    cursor: pointer;
    padding: var(--space-2) 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
  }

  .docs-sidebar__toggle:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
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
