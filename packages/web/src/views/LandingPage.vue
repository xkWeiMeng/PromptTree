<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@/composables'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteLayout from '@/components/site/SiteLayout.vue'
import FeatureIllustration from '@/components/site/FeatureIllustration.vue'
import { TreePine, Smartphone, Monitor, Puzzle, ArrowRight } from 'lucide-vue-next'

const { t } = useI18n()
const { localePath } = useLocalePath()

useHead({
  title: '',
  description: t('landing.metaDesc')
})

const features = computed(() => [
  { illustration: 'tree', color: 'blue', title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
  { illustration: 'variable', color: 'purple', title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
  { illustration: 'offline', color: 'orange', title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
  { illustration: 'sync', color: 'green', title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
  { illustration: 'extension', color: 'teal', title: t('landing.feature5Title'), desc: t('landing.feature5Desc') },
  { illustration: 'mindmap', color: 'indigo', title: t('landing.feature6Title'), desc: t('landing.feature6Desc') },
  { illustration: 'share', color: 'blue', title: t('landing.feature7Title'), desc: t('landing.feature7Desc') },
  { illustration: 'api', color: 'purple', title: t('landing.feature8Title'), desc: t('landing.feature8Desc') },
])

const platforms = computed(() => [
  {
    icon: Monitor,
    title: t('landing.platformWebTitle'),
    desc: t('landing.platformWebDesc'),
  },
  {
    icon: Smartphone,
    title: t('landing.platformMobileTitle'),
    desc: t('landing.platformMobileDesc'),
  },
  {
    icon: Puzzle,
    title: t('landing.platformExtTitle'),
    desc: t('landing.platformExtDesc'),
  },
])
</script>

<template>
  <SiteLayout>
    <!-- Hero -->
    <section class="hero">
      <div class="site-container">
        <div class="hero__badge">
          <TreePine :size="14" />
          {{ t('landing.badge') }}
        </div>
        <h1 class="hero__title">
          {{ t('landing.heroTitle') }}<br>
          <span class="hero__title-accent">{{ t('landing.heroTitleAccent') }}</span>
        </h1>
        <p class="hero__subtitle">
          {{ t('landing.heroSubtitle') }}
        </p>
        <div class="hero__actions">
          <RouterLink to="/app" class="hero__btn hero__btn--primary">
            {{ t('landing.ctaStart') }}
            <ArrowRight :size="18" />
          </RouterLink>
          <RouterLink :to="localePath('/features')" class="hero__btn hero__btn--secondary">
            {{ t('landing.ctaLearnMore') }}
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 核心功能 -->
    <section class="features-section">
      <div class="site-container">
        <h2 class="features-section__title">{{ t('landing.featuresTitle') }}</h2>
        <p class="features-section__desc">
          {{ t('landing.featuresDesc') }}
        </p>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-card__illustration" :class="`feature-card__illustration--${f.color}`">
              <FeatureIllustration :name="f.illustration" />
            </div>
            <h3 class="feature-card__title">{{ f.title }}</h3>
            <p class="feature-card__desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 多平台 -->
    <section class="platforms-section">
      <div class="site-container">
        <h2 class="features-section__title">{{ t('landing.platformsTitle') }}</h2>
        <p class="features-section__desc">
          {{ t('landing.platformsDesc') }}
        </p>
        <div class="platform-cards">
          <div v-for="p in platforms" :key="p.title" class="platform-card">
            <component :is="p.icon" class="platform-card__icon" :size="40" />
            <h3 class="platform-card__title">{{ p.title }}</h3>
            <p class="platform-card__desc">{{ p.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 使用场景 -->
    <section class="features-section">
      <div class="site-container">
        <h2 class="features-section__title">{{ t('landing.scenariosTitle') }}</h2>
        <p class="features-section__desc">
          {{ t('landing.scenariosDesc') }}
        </p>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-card__illustration feature-card__illustration--blue">
              <FeatureIllustration name="creator" />
            </div>
            <h3 class="feature-card__title">{{ t('landing.scenario1Title') }}</h3>
            <p class="feature-card__desc">
              {{ t('landing.scenario1Desc') }}
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-card__illustration feature-card__illustration--green">
              <FeatureIllustration name="developer" />
            </div>
            <h3 class="feature-card__title">{{ t('landing.scenario2Title') }}</h3>
            <p class="feature-card__desc">
              {{ t('landing.scenario2Desc') }}
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-card__illustration feature-card__illustration--purple">
              <FeatureIllustration name="researcher" />
            </div>
            <h3 class="feature-card__title">{{ t('landing.scenario3Title') }}</h3>
            <p class="feature-card__desc">
              {{ t('landing.scenario3Desc') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="site-container">
        <h2 class="cta-section__title">{{ t('landing.ctaTitle') }}</h2>
        <p class="cta-section__desc">
          {{ t('landing.ctaDesc') }}
        </p>
        <RouterLink to="/app" class="hero__btn hero__btn--primary">
          {{ t('landing.ctaBtn') }}
          <ArrowRight :size="18" />
        </RouterLink>
      </div>
    </section>
  </SiteLayout>
</template>
