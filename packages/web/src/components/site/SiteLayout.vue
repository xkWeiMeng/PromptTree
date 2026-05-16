<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SiteHeader from './SiteHeader.vue'
import SiteFooter from './SiteFooter.vue'

const { t } = useI18n()
</script>

<template>
  <div class="site-page">
    <a href="#main-content" class="skip-link">{{ t('common.skipToContent') }}</a>
    <SiteHeader />
    <main id="main-content">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-accent);
  color: var(--text-on-accent);
  padding: var(--space-2) var(--space-4);
  z-index: 1000;
  transition: top 0.2s;
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: 0 0 var(--radius-sm) 0;
}

.skip-link:focus {
  top: 0;
}
</style>
