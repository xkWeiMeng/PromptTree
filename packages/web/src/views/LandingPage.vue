<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@/composables'
import { useJsonLd, buildWebSiteSchema, buildProductSchema } from '@/composables'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteLayout from '@/components/site/SiteLayout.vue'
import FeatureIllustration from '@/components/site/FeatureIllustration.vue'
import { TreePine, Smartphone, Monitor, Puzzle, ArrowRight, Star } from 'lucide-vue-next'

const { t } = useI18n()
const { localePath } = useLocalePath()

useHead({
  title: t('landing.pageTitle'),
  description: t('landing.metaDesc'),
  ogType: 'website',
})

useJsonLd('website', buildWebSiteSchema())
useJsonLd('product', buildProductSchema())

const features = computed(() => [
  { illustration: 'tree', color: 'blue', title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
  { illustration: 'variable', color: 'purple', title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
  { illustration: 'offline', color: 'orange', title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
  { illustration: 'sync', color: 'green', title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
  { illustration: 'extension', color: 'teal', title: t('landing.feature5Title'), desc: t('landing.feature5Desc') },
  { illustration: 'mindmap', color: 'indigo', title: t('landing.feature6Title'), desc: t('landing.feature6Desc') },
  { illustration: 'share', color: 'blue', title: t('landing.feature7Title'), desc: t('landing.feature7Desc') },
  { illustration: 'api', color: 'purple', title: t('landing.feature8Title'), desc: t('landing.feature8Desc') },
  { illustration: 'skills', color: 'teal', title: t('landing.feature9Title'), desc: t('landing.feature9Desc') },
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
          {{ t('landing.heroTitle') }}
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
            {{ t('landing.ctaExploreFeatures') }}
          </RouterLink>
        </div>
        <p class="hero__free-note">{{ t('landing.ctaFreeNote') }}</p>
      </div>
    </section>

    <!-- Social Proof -->
    <section class="social-proof">
      <div class="site-container">
        <div class="social-proof__inner">
          <span class="social-proof__badge">{{ t('landing.socialProofBadge') }}</span>
          <a
            href="https://github.com/xkWeiMeng/PromptTree"
            target="_blank"
            rel="noopener noreferrer"
            class="social-proof__github"
          >
            <Star :size="14" />
            {{ t('landing.githubStars') }}
          </a>
          <div class="social-proof__stats">
            <span>{{ t('landing.statPrompts') }}</span>
            <span class="social-proof__divider">·</span>
            <span>{{ t('landing.statUsers') }}</span>
          </div>
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
          <article v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-card__illustration" :class="`feature-card__illustration--${f.color}`">
              <FeatureIllustration :name="f.illustration" />
            </div>
            <h3 class="feature-card__title">{{ f.title }}</h3>
            <p class="feature-card__desc">{{ f.desc }}</p>
          </article>
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
          <article v-for="p in platforms" :key="p.title" class="platform-card">
            <component :is="p.icon" class="platform-card__icon" :size="40" />
            <h3 class="platform-card__title">{{ p.title }}</h3>
            <p class="platform-card__desc">{{ p.desc }}</p>
          </article>
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
          <article class="feature-card">
            <div class="feature-card__illustration feature-card__illustration--blue">
              <FeatureIllustration name="creator" />
            </div>
            <h3 class="feature-card__title">{{ t('landing.scenario1Title') }}</h3>
            <p class="feature-card__desc">
              {{ t('landing.scenario1Desc') }}
            </p>
          </article>
          <article class="feature-card">
            <div class="feature-card__illustration feature-card__illustration--green">
              <FeatureIllustration name="developer" />
            </div>
            <h3 class="feature-card__title">{{ t('landing.scenario2Title') }}</h3>
            <p class="feature-card__desc">
              {{ t('landing.scenario2Desc') }}
            </p>
          </article>
          <article class="feature-card">
            <div class="feature-card__illustration feature-card__illustration--purple">
              <FeatureIllustration name="researcher" />
            </div>
            <h3 class="feature-card__title">{{ t('landing.scenario3Title') }}</h3>
            <p class="feature-card__desc">
              {{ t('landing.scenario3Desc') }}
            </p>
          </article>
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

<style scoped>
/* ===================
   Typography — balanced headings & accent line-break replacement
   =================== */
.hero__title,
.features-section__title,
.cta-section__title {
  text-wrap: balance;
}

.hero__title-accent {
  display: block;
}

/* ===================
   Interaction — press feedback & smooth transitions
   =================== */
.hero__btn--primary:active,
.hero__btn--secondary:active {
  transform: scale(0.98);
}

.hero__btn--secondary {
  transition: background-color var(--duration-normal) var(--ease-out),
              color var(--duration-normal) var(--ease-out),
              transform var(--duration-normal) var(--ease-out);
}

.hero__free-note {
  margin-top: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

/* ===================
   Social Proof
   =================== */
.social-proof {
  padding: var(--space-6) 0;
  text-align: center;
}

.social-proof__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.social-proof__badge {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.social-proof__github {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-decoration: none;
  transition: border-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.social-proof__github:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.social-proof__stats {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.social-proof__divider {
  color: var(--border-secondary);
}

/* ===================
   Mobile Responsiveness (≤ 640px)
   =================== */
@media (max-width: 640px) {
  /* Hero */
  .hero {
    padding-top: calc(var(--site-header-height) + var(--space-16));
    padding-bottom: var(--space-12);
  }

  .hero__title {
    font-size: var(--font-size-h2);
  }

  .hero__subtitle {
    font-size: var(--font-size-md);
    margin-bottom: var(--space-6);
  }

  /* CTA buttons full-width on mobile */
  .hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero__btn {
    width: 100%;
    justify-content: center;
  }

  /* Container padding reduction */
  .hero .site-container,
  .features-section .site-container,
  .platforms-section .site-container,
  .cta-section .site-container {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }

  /* Feature cards already 1fr via site.css — ensure card padding reduction */
  .feature-card {
    padding: var(--space-6);
  }

  /* Platform cards single-column */
  .platform-cards {
    grid-template-columns: 1fr;
  }

  .platform-card {
    padding: var(--space-6);
  }

  /* CTA section */
  .cta-section {
    padding: var(--space-12) 0;
  }

  .cta-section__title {
    font-size: var(--font-size-h3);
  }

  .cta-section__desc {
    font-size: var(--font-size-md);
  }

  /* Sections padding reduction */
  .features-section,
  .platforms-section {
    padding: var(--space-12) 0;
  }
}
</style>
