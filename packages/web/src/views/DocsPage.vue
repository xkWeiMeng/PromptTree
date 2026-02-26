<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@/composables'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteLayout from '@/components/site/SiteLayout.vue'
import { getAllDocs } from '@/utils/content'
import { FileText, ArrowRight } from 'lucide-vue-next'

const { t, locale } = useI18n()
const { localePath } = useLocalePath()

useHead({
  title: t('docs.pageTitle'),
  description: t('docs.metaDesc')
})

const docs = computed(() => getAllDocs(locale.value))
</script>

<template>
  <SiteLayout>
    <section class="page-header">
      <div class="site-container">
        <h1 class="page-header__title">{{ t('docs.pageTitle') }}</h1>
        <p class="page-header__desc">
          {{ t('docs.pageDesc') }}
        </p>
      </div>
    </section>

    <div class="site-container" style="padding-bottom: var(--space-20);">
      <div class="docs-list">
        <RouterLink
          v-for="doc in docs"
          :key="doc.meta.slug"
          :to="localePath(`/docs/${doc.meta.slug}`)"
          class="docs-list__item"
        >
          <FileText :size="20" class="docs-list__icon" />
          <div class="docs-list__content">
            <h3 class="docs-list__title">{{ doc.meta.title }}</h3>
            <p class="docs-list__desc">{{ doc.meta.description }}</p>
          </div>
          <ArrowRight :size="16" class="docs-list__arrow" />
        </RouterLink>
      </div>
    </div>
  </SiteLayout>
</template>

<style scoped>
.docs-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: var(--site-content-width);
  margin: 0 auto;
}

.docs-list__item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--bg-primary);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.docs-list__item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  text-decoration: none;
}

.docs-list__icon {
  color: var(--color-accent);
  flex-shrink: 0;
}

.docs-list__content {
  flex: 1;
  min-width: 0;
}

.docs-list__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.docs-list__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.docs-list__arrow {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
</style>
