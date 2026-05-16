<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { useLoginModal } from '@/composables/useLoginModal'
import {
  RefreshCw, AlertTriangle, User,
  WifiOff, CheckCircle, Menu
} from 'lucide-vue-next'
import BrandLogo from '@/components/common/BrandLogo.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import UserProfilePanel from '@/components/common/UserProfilePanel.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const syncStore = useSyncStore()
const loginModal = useLoginModal()

// 侧边栏宽度
const sidebarWidth = ref(280)
const isResizing = ref(false)
const minWidth = 200
const maxWidth = 500

// 移动端菜单
const isMobileMenuOpen = ref(false)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches
  if (!isMobile.value) isMobileMenuOpen.value = false
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

// 用户信息
const user = computed(() => authStore.user)
const isOfflineMode = computed(() => authStore.isOfflineMode)
const isLoggedIn = computed(() => authStore.isLoggedIn)

// 同步状态
const syncStatus = computed(() => syncStore.status)
const syncStatusText = computed(() => {
  switch (syncStore.status) {
    case 'syncing': return t('sync.syncing')
    case 'success': return t('sync.synced')
    case 'error': return t('sync.error')
    default: return ''
  }
})

// 开始调整大小
function startResize(e: MouseEvent) {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

// 调整大小
function handleResize(e: MouseEvent) {
  if (!isResizing.value) return
  const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX))
  sidebarWidth.value = newWidth
}

// 停止调整大小
function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 手动同步
async function handleSync() {
  await syncStore.fullSync()
}

// 打开登录弹窗
function openLogin() {
  loginModal.open()
}

// 用户资料面板
const showProfilePanel = ref(false)
const profileAnchorRef = ref<HTMLElement | null>(null)

function toggleProfilePanel() {
  showProfilePanel.value = !showProfilePanel.value
}

function closeProfilePanel() {
  showProfilePanel.value = false
}

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div class="main-layout" :class="{ resizing: isResizing }">
    <!-- Skip to main content -->
    <a href="#main-content" class="skip-link">{{ t('common.skipToContent') }}</a>

    <!-- Mobile menu button -->
    <button
      v-if="isMobile"
      class="mobile-menu-btn"
      :aria-label="t('layout.menu')"
      :aria-expanded="isMobileMenuOpen"
      @click="toggleMobileMenu"
    >
      <Menu :size="20" />
    </button>

    <!-- Mobile overlay -->
    <div
      v-if="isMobile && isMobileMenuOpen"
      class="sidebar-overlay"
      @click="closeMobileMenu"
    ></div>

    <!-- 侧边栏 -->
    <aside
      class="sidebar"
      :class="{ 'sidebar--open': isMobileMenuOpen }"
      :style="isMobile ? undefined : { width: sidebarWidth + 'px' }"
    >
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <RouterLink to="/" class="logo" aria-label="PromptTree">
          <BrandLogo :size="22" />
          <span>PromptTree</span>
        </RouterLink>
        <!-- 离线模式标识 -->
        <div v-if="isOfflineMode" class="offline-badge">
          <WifiOff :size="12" />
          <span>{{ t('layout.offlineMode') }}</span>
        </div>
        <!-- 同步状态（仅登录用户显示） -->
        <div v-else-if="isLoggedIn" class="sync-status" :class="syncStatus">
          <RefreshCw v-if="syncStatus === 'syncing'" :size="12" class="animate-spin" />
          <CheckCircle v-else-if="syncStatus === 'success'" :size="12" />
          <AlertTriangle v-else-if="syncStatus === 'error'" :size="12" />
          <span class="sync-text">{{ syncStatusText }}</span>
        </div>
      </div>
      
      <!-- 侧边栏内容（树视图插槽） -->
      <div class="sidebar-content">
        <slot name="sidebar"></slot>
      </div>
      
      <!-- 侧边栏底部 -->
      <div class="sidebar-footer">
        <!-- 登录用户信息 -->
        <div
          class="user-avatar-btn"
          v-if="user"
          ref="profileAnchorRef"
          role="button"
          tabindex="0"
          aria-haspopup="true"
          :aria-expanded="showProfilePanel"
          @click="toggleProfilePanel"
          @keydown.enter="toggleProfilePanel"
          @keydown.space.prevent="toggleProfilePanel"
        >
          <img v-if="user.avatarUrl" :src="user.avatarUrl" class="avatar avatar-img" alt="" />
          <span v-else class="avatar"><User :size="14" /></span>
        </div>
        <!-- 离线模式用户 -->
        <div class="user-info" v-else-if="isOfflineMode">
          <span class="avatar offline-avatar">
            <User :size="14" />
          </span>
          <span class="name">{{ t('layout.localUser') }}</span>
        </div>
        <!-- 用户资料面板 -->
        <UserProfilePanel
          v-if="showProfilePanel && user"
          :anchor="profileAnchorRef"
          @close="closeProfilePanel"
        />
        <div class="footer-actions">
          <ThemeToggle placement="top" />
          <!-- 离线模式：显示登录按钮 -->
          <button v-if="isOfflineMode" class="btn-login" @click="openLogin">
            {{ t('layout.loginToSync') }}
          </button>
          <!-- 登录用户：同步 -->
          <template v-else>
            <button class="icon-btn" :title="t('sync.sync')" :aria-label="t('sync.sync')" @click="handleSync">
              <RefreshCw :size="15" />
            </button>
          </template>
        </div>
      </div>
    </aside>
    
    <!-- 调整大小手柄 -->
    <div class="resize-handle" @mousedown="startResize"></div>
    
    <!-- 主内容区 -->
    <main id="main-content" class="main-content">
      <slot name="content"></slot>
    </main>
  </div>
</template>

<style scoped>
/* ===================
   Skip Link (a11y)
   =================== */
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 200;
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: var(--text-on-accent);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  border-radius: var(--radius-sm);
}

.skip-link:focus {
  position: fixed;
  left: var(--space-4);
  top: var(--space-4);
  width: auto;
  height: auto;
}

/* ===================
   Layout
   =================== */
.main-layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--bg-primary);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.main-layout.resizing {
  user-select: none;
  cursor: col-resize;
}

/* ===================
   Mobile Menu Button
   =================== */
.mobile-menu-btn {
  display: none;
}

/* ===================
   Mobile Overlay
   =================== */
.sidebar-overlay {
  display: none;
}

/* ===================
   Sidebar — macOS Vibrancy
   =================== */
.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--bg-sidebar);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  border-right: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

@supports not (backdrop-filter: blur(1px)) {
  .sidebar {
    background: var(--bg-secondary);
  }
}

.sidebar-header {
  padding: var(--space-3) var(--space-4);
  padding-top: calc(var(--safe-area-top, env(safe-area-inset-top, 0px)) + var(--space-3));
  border-bottom: 0.5px solid var(--border-secondary);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-tight);
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;
  margin-bottom: var(--space-1);
}

.sync-status {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.sync-status.syncing {
  color: var(--color-accent);
}

.sync-status.success {
  color: var(--color-success);
}

.sync-status.error {
  color: var(--color-danger);
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
}

/* ===================
   Sidebar Footer
   =================== */
.sidebar-footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-top: 0.5px solid var(--border-secondary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.user-avatar-btn {
  cursor: pointer;
  border-radius: var(--radius-full);
  padding: 2px;
  transition: background var(--duration-fast) ease;
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar-btn:hover {
  background: var(--bg-hover);
}

.avatar {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--text-on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.avatar-img {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  object-fit: cover;
  background: var(--bg-tertiary);
}

.avatar.offline-avatar {
  background: var(--bg-quaternary);
  color: var(--text-secondary);
}

.name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-actions {
  display: flex;
  gap: var(--space-1);
}

.btn-login {
  padding: var(--space-1) var(--space-3);
  background: var(--color-accent);
  color: var(--text-on-accent);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.btn-login:hover {
  background: var(--color-accent-hover);
}

.btn-login:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.offline-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  background: var(--color-warning-bg);
  border: 0.5px solid var(--color-warning);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--text-warning);
}

/* ===================
   Resize Handle
   =================== */
.resize-handle {
  width: 1px;
  cursor: col-resize;
  background: transparent;
  position: relative;
  z-index: 10;
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  left: -3px;
  right: -3px;
  bottom: 0;
}

.resize-handle:hover,
.main-layout.resizing .resize-handle {
  background: var(--color-accent);
  box-shadow: 0 0 4px var(--color-accent);
}

/* ===================
   Main Content
   =================== */
.main-content {
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary);
}

/* ===================
   Mobile — ≤768px
   =================== */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: var(--space-2);
    left: var(--space-2);
    z-index: 101;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    border: 0.5px solid var(--border-secondary);
    color: var(--text-primary);
    cursor: pointer;
    padding-top: env(safe-area-inset-top, 0px);
  }

  .mobile-menu-btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 99;
    background: rgba(0, 0, 0, 0.4);
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 80vw;
    max-width: calc(80vw - env(safe-area-inset-right, 0));
    z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--duration-normal) ease;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .sidebar.sidebar--open {
    transform: translateX(0);
  }

  .resize-handle {
    display: none;
  }

  .main-content {
    width: 100%;
    flex: 1;
  }
}
</style>
