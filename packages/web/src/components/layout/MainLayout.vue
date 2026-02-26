<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { useLoginModal } from '@/composables/useLoginModal'
import {
  RefreshCw, AlertTriangle, User,
  WifiOff, CheckCircle
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
})
</script>

<template>
  <div class="main-layout" :class="{ resizing: isResizing }">
    <!-- 侧边栏 -->
    <aside class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <RouterLink to="/" class="logo">
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
        <div class="user-avatar-btn" v-if="user" ref="profileAnchorRef" @click="toggleProfilePanel">
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
            <button class="icon-btn" :title="t('sync.sync')" @click="handleSync">
              <RefreshCw :size="15" />
            </button>
          </template>
        </div>
      </div>
    </aside>
    
    <!-- 调整大小手柄 -->
    <div class="resize-handle" @mousedown="startResize"></div>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <slot name="content"></slot>
    </main>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.main-layout.resizing {
  user-select: none;
  cursor: col-resize;
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
</style>
