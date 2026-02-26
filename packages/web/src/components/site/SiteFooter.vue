<script setup lang="ts">
import { TreePine } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '@/composables/useLocalePath'

const { t } = useI18n()
const { localePath } = useLocalePath()
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__grid">
        <!-- 品牌 -->
        <div class="site-footer__brand">
          <div class="site-footer__brand-name">
            <TreePine :size="20" style="color: var(--color-accent)" />
            PromptTree
          </div>
          <p class="site-footer__brand-desc">
            {{ t('footer.brandDesc') }}
          </p>
        </div>

        <!-- 产品 -->
        <div>
          <div class="site-footer__section-title">{{ t('footer.product') }}</div>
          <div class="site-footer__links">
            <RouterLink :to="localePath('/features')" class="site-footer__link">{{ t('footer.featuresIntro') }}</RouterLink>
            <RouterLink to="/app" class="site-footer__link">{{ t('footer.workspace') }}</RouterLink>
            <RouterLink to="/login" class="site-footer__link">{{ t('footer.loginRegister') }}</RouterLink>
          </div>
        </div>

        <!-- 资源 -->
        <div>
          <div class="site-footer__section-title">{{ t('footer.resources') }}</div>
          <div class="site-footer__links">
            <RouterLink :to="localePath('/docs')" class="site-footer__link">{{ t('footer.useDocs') }}</RouterLink>
            <RouterLink :to="localePath('/docs/getting-started')" class="site-footer__link">{{ t('footer.quickStart') }}</RouterLink>
            <RouterLink :to="localePath('/blog')" class="site-footer__link">{{ t('footer.blog') }}</RouterLink>
          </div>
        </div>

        <!-- 关于 -->
        <div>
          <div class="site-footer__section-title">{{ t('footer.about') }}</div>
          <div class="site-footer__links">
            <a href="https://github.com/nicekate" target="_blank" rel="noopener" class="site-footer__link">GitHub</a>
            <a href="mailto:hi@prompttree.app" class="site-footer__link">{{ t('footer.contactUs') }}</a>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="site-footer__bottom">
        <span class="site-footer__copyright">
          {{ t('footer.copyright', { year: new Date().getFullYear() }) }}
        </span>
        <div class="site-footer__friends">
          {{ t('footer.friendLinks') }}
          <a href="https://ruledock.tech" target="_blank" rel="noopener">RuleDock</a>
        </div>
      </div>
    </div>
  </footer>
</template>
