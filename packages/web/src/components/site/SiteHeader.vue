<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Menu, X, User } from 'lucide-vue-next'
import BrandLogo from '@/components/common/BrandLogo.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import UserProfilePanel from '@/components/common/UserProfilePanel.vue'
import { useAuthStore } from '@/stores/auth'
import { useLoginModal } from '@/composables/useLoginModal'
import { useLocalePath } from '@/composables/useLocalePath'

const { t } = useI18n()
const route = useRoute()
const mobileOpen = ref(false)
const authStore = useAuthStore()
const loginModal = useLoginModal()
const { localePath } = useLocalePath()

// 用户资料面板
const showProfilePanel = ref(false)
const profileAnchorRef = ref<HTMLElement | null>(null)

function toggleProfilePanel() {
  showProfilePanel.value = !showProfilePanel.value
}

function closeProfilePanel() {
  showProfilePanel.value = false
}

const navLinks = computed(() => [
  { to: localePath('/features'), label: t('nav.features') },
  { to: localePath('/docs'), label: t('nav.docs') },
  { to: localePath('/blog'), label: t('nav.blog') },
])

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function closeMobile() {
  mobileOpen.value = false
}

function openLogin() {
  closeMobile()
  loginModal.open()
}
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <RouterLink :to="localePath('/')" class="site-header__logo" @click="closeMobile">
        <BrandLogo class="site-header__logo-icon" :size="24" />
        <span>PromptTree</span>
      </RouterLink>

      <nav class="site-header__nav">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="site-header__link"
          :class="{ 'site-header__link--active': isActive(link.to) }"
        >
          {{ link.label }}
        </RouterLink>
        <ThemeToggle />
        <LanguageSwitcher />
        <!-- 已登录：显示头像 + 进入工作台 -->
        <template v-if="authStore.isLoggedIn">
          <div class="site-header__user" ref="profileAnchorRef" @click="toggleProfilePanel">
            <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" class="site-header__user-avatar" alt="" />
            <span v-else class="site-header__user-avatar site-header__user-avatar--fallback"><User :size="16" /></span>
            <UserProfilePanel
              v-if="showProfilePanel"
              :anchor="profileAnchorRef"
              placement="bottom"
              @close="closeProfilePanel"
            />
          </div>
          <RouterLink to="/app" class="btn-primary site-header__cta">{{ t('nav.enterWorkspace') }}</RouterLink>
        </template>
        <!-- 未登录：登录按钮 + 开始使用 -->
        <template v-else>
          <button class="site-header__link site-header__login-btn" @click="openLogin">{{ t('nav.login') }}</button>
          <RouterLink to="/app" class="btn-primary site-header__cta">{{ t('nav.getStarted') }}</RouterLink>
        </template>
      </nav>

      <button class="site-header__menu-btn" @click="mobileOpen = !mobileOpen">
        <Menu v-if="!mobileOpen" :size="20" />
        <X v-else :size="20" />
      </button>
    </div>
  </header>

  <!-- 移动端导航 -->
  <nav class="site-mobile-nav" :class="{ 'site-mobile-nav--open': mobileOpen }">
    <RouterLink
      v-for="link in navLinks"
      :key="link.to"
      :to="link.to"
      class="site-mobile-nav__link"
      @click="closeMobile"
    >
      {{ link.label }}
    </RouterLink>
    <ThemeToggle />
    <LanguageSwitcher />
    <template v-if="authStore.isLoggedIn">
      <RouterLink to="/app" class="site-mobile-nav__link" @click="closeMobile">
        {{ t('nav.enterWorkspaceMobile') }}
      </RouterLink>
    </template>
    <template v-else>
      <button class="site-mobile-nav__link site-mobile-nav__login-btn" @click="openLogin">{{ t('nav.login') }}</button>
      <RouterLink to="/app" class="site-mobile-nav__link" @click="closeMobile">
        {{ t('nav.getStartedMobile') }}
      </RouterLink>
    </template>
  </nav>
</template>

<style scoped>
.site-header__user {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--space-1);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.site-header__user:hover {
  background: var(--bg-hover);
}

.site-header__user-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.site-header__user-avatar--fallback {
  background: var(--color-accent);
  color: var(--text-on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}
</style>