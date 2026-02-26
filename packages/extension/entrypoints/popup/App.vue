<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTreeStore } from '@/stores/tree'
import { useSyncStore } from '@/stores/sync'
import { useToast } from '@/composables/useToast'
import { getTheme, type ThemeMode } from '@/utils/storage'
import LoginView from './views/LoginView.vue'
import MainView from './views/MainView.vue'
import SettingsView from './views/SettingsView.vue'
import Toast from './components/Toast.vue'

type ViewName = 'login' | 'main' | 'settings'

const authStore = useAuthStore()
const treeStore = useTreeStore()
const syncStore = useSyncStore()
const toast = useToast()

const currentView = ref<ViewName>('login')
const loading = ref(true)

// =================== 主题 ===================
async function applyTheme(mode?: ThemeMode) {
  const theme = mode ?? await getTheme()
  document.documentElement.classList.remove('theme-light', 'theme-dark')
  if (theme !== 'system') {
    document.documentElement.classList.add(`theme-${theme}`)
  }
}

// =================== 初始化 ===================
onMounted(async () => {
  try {
    await applyTheme()
    await authStore.init()
    if (authStore.canAccessApp) {
      await treeStore.init()
      currentView.value = 'main'
      // 非离线模式自动同步
      if (!authStore.isOfflineMode) {
        syncStore.triggerSync()
      }
    } else {
      currentView.value = 'login'
    }
  } catch (err) {
    console.error('Init error:', err)
    currentView.value = 'login'
  } finally {
    loading.value = false
  }
})

// =================== 视图切换 ===================
function handleLoginSuccess() {
  treeStore.init().then(() => {
    currentView.value = 'main'
    syncStore.fullSync()
  })
}

function handleOfflineMode() {
  treeStore.init().then(() => {
    currentView.value = 'main'
  })
}

function openSettings() {
  currentView.value = 'settings'
}

function backToMain() {
  currentView.value = 'main'
}

// 监听认证状态，登出时回到登录
watch(() => authStore.canAccessApp, (canAccess) => {
  if (!canAccess && currentView.value !== 'login') {
    currentView.value = 'login'
  }
})
</script>

<template>
  <div class="popup">
    <div v-if="loading" class="loading">
      <div class="spinner" />
      <span>加载中…</span>
    </div>
    <template v-else>
      <LoginView
        v-if="currentView === 'login'"
        @success="handleLoginSuccess"
        @offline="handleOfflineMode"
      />
      <SettingsView
        v-else-if="currentView === 'settings'"
        @back="backToMain"
        @theme-change="applyTheme"
      />
      <MainView
        v-else
        @open-settings="openSettings"
      />
    </template>
    <Toast />
  </div>
</template>

<style>
:root {
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --color-hover: #f3f4f6;
  --color-danger: #ef4444;
  --color-success: #10b981;
  --color-warning: #f59e0b;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Microsoft YaHei', sans-serif;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-bg);
}

.popup {
  width: 360px;
  height: 520px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 全局滚动条 */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}
</style>
