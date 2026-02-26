<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Globe } from 'lucide-vue-next'
import {
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  saveLocalePreference,
  getLocalePath,
  stripLocalePath,
  isNonLocalePath,
  type SupportedLocale
} from '@/utils/locale'
import { setLocale } from '@/i18n'

const { locale } = useI18n()
const router = useRouter()
const route = useRoute()
const open = ref(false)
const switcherRef = ref<HTMLElement | null>(null)

async function switchLocale(newLocale: SupportedLocale) {
  if (newLocale === locale.value) {
    open.value = false
    return
  }

  await setLocale(newLocale)
  saveLocalePreference(newLocale)

  // 如果当前页面是带 locale 前缀的公开页面，更新路由
  if (!isNonLocalePath(route.path)) {
    const basePath = stripLocalePath(route.fullPath)
    const newPath = getLocalePath(basePath, newLocale)
    router.replace(newPath)
  }

  open.value = false
}

function toggleMenu() {
  open.value = !open.value
}

function onClickOutside(e: MouseEvent) {
  if (open.value && switcherRef.value && !switcherRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside, true)
})
</script>

<template>
  <div ref="switcherRef" class="lang-switcher">
    <button
      class="lang-switcher__trigger"
      :title="$t('languageSwitcher.label')"
      @click="toggleMenu"
    >
      <Globe :size="16" />
      <span class="lang-switcher__current">{{ LOCALE_LABELS[locale as SupportedLocale] }}</span>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="lang-switcher__menu">
        <button
          v-for="loc in SUPPORTED_LOCALES"
          :key="loc"
          class="lang-switcher__item"
          :class="{ 'lang-switcher__item--active': locale === loc }"
          @click="switchLocale(loc)"
        >
          {{ LOCALE_LABELS[loc] }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lang-switcher {
  position: relative;
}

.lang-switcher__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: all var(--duration-fast) ease;
  white-space: nowrap;
}

.lang-switcher__trigger:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
  border-color: var(--border-primary);
}

.lang-switcher__current {
  font-weight: var(--font-weight-medium);
}

.lang-switcher__menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  min-width: 140px;
  background: var(--bg-primary);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1);
  z-index: 1000;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.lang-switcher__item {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.lang-switcher__item:hover {
  background: var(--bg-hover);
}

.lang-switcher__item--active {
  color: var(--color-accent);
  font-weight: var(--font-weight-medium);
}

/* Dropdown animation */
.dropdown-enter-active {
  transition: opacity var(--duration-fast) ease, transform var(--duration-fast) ease;
}

.dropdown-leave-active {
  transition: opacity var(--duration-fast) ease, transform var(--duration-fast) ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
