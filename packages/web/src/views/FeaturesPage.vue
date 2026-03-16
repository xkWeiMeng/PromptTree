<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@/composables'
import SiteLayout from '@/components/site/SiteLayout.vue'
import FeatureDetailIllustration from '@/components/site/FeatureDetailIllustration.vue'
import { ArrowRight } from 'lucide-vue-next'

const { t } = useI18n()

useHead({
  title: t('features.pageTitle'),
  description: t('features.metaDesc')
})

const features = computed(() => [
  {
    tag: t('features.tagCore'),
    illustration: 'tree',
    color: 'blue',
    title: t('features.treeTitle'),
    desc: t('features.treeDesc'),
    highlights: [t('features.treeH1'), t('features.treeH2'), t('features.treeH3')]
  },
  {
    tag: t('features.tagKiller'),
    illustration: 'variable',
    color: 'purple',
    title: t('features.variableTitle'),
    desc: t('features.variableDesc'),
    highlights: [t('features.variableH1'), t('features.variableH2'), t('features.variableH3')]
  },
  {
    tag: t('features.tagArchitecture'),
    illustration: 'offline',
    color: 'orange',
    title: t('features.offlineTitle'),
    desc: t('features.offlineDesc'),
    highlights: [t('features.offlineH1'), t('features.offlineH2'), t('features.offlineH3')]
  },
  {
    tag: t('features.tagPlatform'),
    illustration: 'sync',
    color: 'green',
    title: t('features.syncTitle'),
    desc: t('features.syncDesc'),
    highlights: [t('features.syncH1'), t('features.syncH2'), t('features.syncH3')]
  },
  {
    tag: t('features.tagEfficiency'),
    illustration: 'extension',
    color: 'teal',
    title: t('features.extensionTitle'),
    desc: t('features.extensionDesc'),
    highlights: [t('features.extensionH1'), t('features.extensionH2'), t('features.extensionH3')]
  },
  {
    tag: t('features.tagCollaboration'),
    illustration: 'share',
    color: 'blue',
    title: t('features.shareTitle'),
    desc: t('features.shareDesc'),
    highlights: [t('features.shareH1'), t('features.shareH2'), t('features.shareH3')]
  },
  {
    tag: t('features.tagIntegration'),
    illustration: 'api',
    color: 'purple',
    title: t('features.apiAccessTitle'),
    desc: t('features.apiAccessDesc'),
    highlights: [t('features.apiAccessH1'), t('features.apiAccessH2'), t('features.apiAccessH3')]
  },
  {
    tag: t('features.tagVisualization'),
    illustration: 'mindmap',
    color: 'indigo',
    title: t('features.mindmapTitle'),
    desc: t('features.mindmapDesc'),
    highlights: [t('features.mindmapH1'), t('features.mindmapH2'), t('features.mindmapH3')]
  },
  {
    tag: t('features.tagVisualization'),
    illustration: 'outline',
    color: 'blue',
    title: t('features.outlineTitle'),
    desc: t('features.outlineDesc'),
    highlights: [t('features.outlineH1'), t('features.outlineH2'), t('features.outlineH3')]
  },
  {
    tag: t('features.tagExperience'),
    illustration: 'dark',
    color: 'pink',
    title: t('features.darkTitle'),
    desc: t('features.darkDesc'),
    highlights: [t('features.darkH1'), t('features.darkH2'), t('features.darkH3')]
  },
  {
    tag: t('features.tagShortcut'),
    illustration: 'keyboard',
    color: 'green',
    title: t('features.keyboardTitle'),
    desc: t('features.keyboardDesc'),
    highlights: [t('features.keyboardH1'), t('features.keyboardH2'), t('features.keyboardH3')]
  },
])
</script>

<template>
  <SiteLayout>
    <!-- Page Header -->
    <section class="page-header">
      <div class="site-container">
        <h1 class="page-header__title">{{ t('features.pageTitle') }}</h1>
        <p class="page-header__desc">
          {{ t('features.pageDesc') }}
        </p>
      </div>
    </section>

    <!-- 功能详情列表 -->
    <div class="site-container">
      <section
        v-for="f in features"
        :key="f.title"
        class="feature-detail"
      >
        <div class="feature-detail__content">
          <span class="feature-detail__tag">{{ f.tag }}</span>
          <h2 class="feature-detail__title">{{ f.title }}</h2>
          <p class="feature-detail__desc">{{ f.desc }}</p>
          <ul class="feature-detail__highlights">
            <li v-for="h in f.highlights" :key="h" class="feature-detail__highlight">
              <span aria-hidden="true">✓</span> {{ h }}
            </li>
          </ul>
        </div>
        <div class="feature-detail__visual">
          <div class="feature-detail__illustration" :class="`feature-detail__illustration--${f.color}`">
            <FeatureDetailIllustration :name="f.illustration" />
          </div>
        </div>
      </section>
    </div>

    <!-- CTA -->
    <section class="cta-section">
      <div class="site-container">
        <h2 class="cta-section__title">{{ t('features.ctaTitle') }}</h2>
        <p class="cta-section__desc">
          {{ t('features.ctaDesc') }}
        </p>
        <RouterLink to="/app" class="hero__btn hero__btn--primary">
          {{ t('features.ctaBtn') }}
          <ArrowRight :size="18" />
        </RouterLink>
      </div>
    </section>
  </SiteLayout>
</template>

<style scoped>
.feature-detail__highlights {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
}

.feature-detail__highlight {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
