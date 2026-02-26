<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { useTreeStore } from '@/stores/tree'
import { getApiBaseUrl, setApiBaseUrl, getTheme, setTheme, type ThemeMode } from '@/utils/storage'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'theme-change', mode: ThemeMode): void
}>()

const authStore = useAuthStore()
const syncStore = useSyncStore()
const treeStore = useTreeStore()

const apiBaseUrl = ref('')
const currentTheme = ref<ThemeMode>('system')

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

onMounted(async () => {
  apiBaseUrl.value = await getApiBaseUrl()
  currentTheme.value = await getTheme()
})

async function handleThemeChange(mode: ThemeMode) {
  currentTheme.value = mode
  await setTheme(mode)
  emit('theme-change', mode)
}

async function handleSaveUrl() {
  const url = apiBaseUrl.value.trim().replace(/\/+$/, '')
  if (url) {
    await setApiBaseUrl(url)
  }
}

async function handleFullSync() {
  await syncStore.fullSync()
  await treeStore.init()
}

async function handleClearData() {
  if (confirm('确定清除所有本地数据？此操作不可恢复。')) {
    await treeStore.clearNodes()
    syncStore.reset()
  }
}

async function handleLogout() {
  if (confirm('确定登出？本地数据将被清除。')) {
    await authStore.logout()
    syncStore.reset()
  }
}
</script>

<template>
  <div class="settings-view">
    <div class="settings-header">
      <button class="back-btn" @click="$emit('back')">← 返回</button>
      <h3>设置</h3>
    </div>

    <div class="settings-body">
      <!-- 账号信息 -->
      <div class="section">
        <h4 class="section-title">账号</h4>
        <template v-if="authStore.isLoggedIn">
          <div class="info-row">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ authStore.user?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">显示名</span>
            <span class="info-value">{{ authStore.user?.displayName || '-' }}</span>
          </div>
          <button class="btn btn--danger btn--full" @click="handleLogout">登出</button>
        </template>
        <template v-else-if="authStore.isOfflineMode">
          <div class="info-row">
            <span class="info-label">模式</span>
            <span class="info-value">离线模式</span>
          </div>
        </template>
      </div>

      <!-- 外观 -->
      <div class="section">
        <h4 class="section-title">外观</h4>
        <div class="theme-switcher">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            class="theme-btn"
            :class="{ active: currentTheme === opt.value }"
            @click="handleThemeChange(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 后端地址 -->
      <div class="section">
        <h4 class="section-title">服务器</h4>
        <div class="form-item">
          <label>后端地址</label>
          <div class="input-row">
            <input v-model="apiBaseUrl" type="text" placeholder="http://localhost:3000" />
            <button class="btn btn--small" @click="handleSaveUrl">保存</button>
          </div>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="section">
        <h4 class="section-title">数据</h4>
        <div class="info-row">
          <span class="info-label">本地节点</span>
          <span class="info-value">{{ treeStore.nodes.length }} 个</span>
        </div>
        <div class="info-row">
          <span class="info-label">待同步</span>
          <span class="info-value">{{ syncStore.pendingCount }} 个</span>
        </div>
        <div class="btn-group">
          <button class="btn btn--secondary btn--full" @click="handleFullSync">
            🔄 全量同步
          </button>
          <button class="btn btn--danger-outline btn--full" @click="handleClearData">
            🗑 清除本地数据
          </button>
        </div>
      </div>

      <!-- 关于 -->
      <div class="section">
        <h4 class="section-title">关于</h4>
        <div class="info-row">
          <span class="info-label">版本</span>
          <span class="info-value">0.1.0</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.settings-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.back-btn {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  color: var(--color-primary, #4f46e5);
  padding: 0;
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  text-transform: uppercase;
  margin: 0 0 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.info-label { color: var(--color-text-secondary, #6b7280); }
.info-value { color: var(--color-text, #1f2937); font-weight: 500; }

.form-item { margin-bottom: 8px; }

.form-item label {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 4px;
}

.input-row {
  display: flex;
  gap: 6px;
}

.input-row input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
  outline: none;
}

.input-row input:focus {
  border-color: var(--color-primary, #4f46e5);
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--full { width: 100%; }
.btn--small { padding: 6px 10px; }

.btn--secondary {
  background: var(--color-bg, #fff);
  border-color: var(--color-border, #e5e7eb);
  color: var(--color-text, #1f2937);
}

.btn--secondary:hover { background: var(--color-hover, #f3f4f6); }

.btn--danger {
  background: #ef4444;
  color: #fff;
}

.btn--danger:hover { opacity: 0.9; }

.btn--danger-outline {
  background: transparent;
  border-color: #ef4444;
  color: #ef4444;
}

.btn--danger-outline:hover {
  background: #fef2f2;
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.theme-switcher {
  display: flex;
  gap: 0;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}

.theme-btn {
  flex: 1;
  padding: 7px 0;
  font-size: 12px;
  font-weight: 500;
  border: none;
  background: var(--color-bg, #fff);
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-btn:not(:last-child) {
  border-right: 1px solid var(--color-border, #e5e7eb);
}

.theme-btn:hover {
  background: var(--color-hover, #f3f4f6);
}

.theme-btn.active {
  background: var(--color-primary, #4f46e5);
  color: #fff;
}
</style>
