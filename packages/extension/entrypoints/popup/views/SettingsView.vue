<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { useTreeStore } from '@/stores/tree'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { getApiBaseUrl, setApiBaseUrl, getTheme, setTheme, type ThemeMode } from '@/utils/storage'
import { setLocale as changeLocale } from '../i18n'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'theme-change', mode: ThemeMode): void
}>()

const { t, locale } = useI18n()
const authStore = useAuthStore()
const syncStore = useSyncStore()
const treeStore = useTreeStore()
const { confirmDanger } = useConfirm()
const { success: toastSuccess, error: toastError } = useToast()

const apiBaseUrl = ref('')
const currentTheme = ref<ThemeMode>('system')
const editDisplayName = ref('')
const isEditingName = ref(false)

const themeOptions: { value: ThemeMode; label: string; key: string }[] = [
  { value: 'system', label: 'System', key: 'theme.system' },
  { value: 'light', label: 'Light', key: 'theme.light' },
  { value: 'dark', label: 'Dark', key: 'theme.dark' },
]

onMounted(async () => {
  apiBaseUrl.value = await getApiBaseUrl()
  currentTheme.value = await getTheme()
})

const localeOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

async function handleThemeChange(mode: ThemeMode) {
  currentTheme.value = mode
  await setTheme(mode)
  emit('theme-change', mode)
}

async function handleLocaleChange(lang: string) {
  await changeLocale(lang)
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
  const confirmed = await confirmDanger(
    t('settings.clearDataConfirm'),
    t('settings.clearDataTitle')
  )
  if (confirmed) {
    await treeStore.clearNodes()
    syncStore.reset()
  }
}

async function handleLogout() {
  const confirmed = await confirmDanger(
    t('settings.logoutConfirm'),
    t('settings.logoutTitle')
  )
  if (confirmed) {
    await authStore.logout()
    syncStore.reset()
  }
}

function startEditName() {
  editDisplayName.value = authStore.user?.displayName || ''
  isEditingName.value = true
}

async function saveDisplayName() {
  const name = editDisplayName.value.trim()
  if (!name) return
  const ok = await authStore.updateProfile({ displayName: name })
  if (ok) {
    toastSuccess(t('settings.nameUpdated'))
  } else {
    toastError(t('settings.updateFailed'))
  }
  isEditingName.value = false
}

function cancelEditName() {
  isEditingName.value = false
}
</script>

<template>
  <div class="settings-view">
    <div class="settings-header">
      <button class="back-btn" @click="$emit('back')">← {{ $t('common.back') }}</button>
      <h3>{{ $t('settings.title') }}</h3>
    </div>

    <div class="settings-body">
      <!-- 账号信息 -->
      <div class="section">
        <h4 class="section-title">{{ $t('settings.account') }}</h4>
        <template v-if="authStore.isLoggedIn">
          <div class="info-row">
            <span class="info-label">{{ $t('settings.email') }}</span>
            <span class="info-value">{{ authStore.user?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ $t('settings.displayName') }}</span>
            <template v-if="isEditingName">
              <div class="input-row">
                <input
                  v-model="editDisplayName"
                  type="text"
                  :placeholder="$t('profile.namePlaceholder')"
                  @keydown.enter="saveDisplayName"
                  @keydown.escape="cancelEditName"
                />
                <button class="btn btn--small" @click="saveDisplayName">{{ $t('common.save') }}</button>
                <button class="btn btn--small btn--secondary" @click="cancelEditName">{{ $t('common.cancel') }}</button>
              </div>
            </template>
            <template v-else>
              <span class="info-value info-value--editable" @click="startEditName">
                {{ authStore.user?.displayName || '-' }} ✏️
              </span>
            </template>
          </div>
          <button class="btn btn--danger btn--full" @click="handleLogout">{{ $t('settings.logout') }}</button>
        </template>
        <template v-else-if="authStore.isOfflineMode">
          <div class="info-row">
            <span class="info-label">{{ $t('settings.mode') }}</span>
            <span class="info-value">{{ $t('settings.offlineMode') }}</span>
          </div>
        </template>
      </div>

      <!-- 外观 -->
      <div class="section">
        <h4 class="section-title">{{ $t('settings.appearance') }}</h4>
        <div class="theme-switcher">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            class="theme-btn"
            :class="{ active: currentTheme === opt.value }"
            @click="handleThemeChange(opt.value)"
          >
            {{ $t(opt.key) }}
          </button>
        </div>
      </div>

      <!-- 语言 -->
      <div class="section">
        <h4 class="section-title">{{ $t('settings.language') }}</h4>
        <div class="theme-switcher locale-switcher">
          <button
            v-for="opt in localeOptions"
            :key="opt.value"
            class="theme-btn"
            :class="{ active: locale === opt.value }"
            @click="handleLocaleChange(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 后端地址 -->
      <div class="section">
        <h4 class="section-title">{{ $t('settings.server') }}</h4>
        <div class="form-item">
          <label>{{ $t('settings.backendUrl') }}</label>
          <div class="input-row">
            <input v-model="apiBaseUrl" type="text" placeholder="http://localhost:3000" />
            <button class="btn btn--small" @click="handleSaveUrl">{{ $t('common.save') }}</button>
          </div>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="section">
        <h4 class="section-title">{{ $t('settings.data') }}</h4>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.localNodes') }}</span>
          <span class="info-value">{{ $t('settings.items', { count: treeStore.nodes.length }) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.pendingSync') }}</span>
          <span class="info-value">{{ $t('settings.items', { count: syncStore.pendingCount }) }}</span>
        </div>
        <div class="btn-group">
          <button class="btn btn--secondary btn--full" @click="handleFullSync">
            🔄 {{ $t('settings.fullSync') }}
          </button>
          <button class="btn btn--danger-outline btn--full" @click="handleClearData">
            🗑 {{ $t('settings.clearData') }}
          </button>
        </div>
      </div>

      <!-- 关于 -->
      <div class="section">
        <h4 class="section-title">{{ $t('settings.about') }}</h4>
        <div class="info-row">
          <span class="info-label">{{ $t('settings.version') }}</span>
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
.info-value--editable { cursor: pointer; }
.info-value--editable:hover { color: var(--color-primary, #4f46e5); }

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

.locale-switcher {
  flex-wrap: wrap;
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
