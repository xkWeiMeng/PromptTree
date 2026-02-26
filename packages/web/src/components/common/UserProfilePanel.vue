<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Camera, Check, X, LogOut, User as UserIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const props = withDefaults(defineProps<{
  anchor: HTMLElement | null
  placement?: 'top' | 'bottom'
}>(), {
  placement: 'top'
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const panelRef = ref<HTMLElement | null>(null)

// 编辑状态
const isEditingName = ref(false)
const editName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)
const isSaving = ref(false)

const isEditingAvatar = ref(false)
const editAvatarUrl = ref('')

const user = computed(() => authStore.user)

// 开始编辑昵称
function startEditName() {
  editName.value = user.value?.displayName || ''
  isEditingName.value = true
  nextTick(() => {
    nameInputRef.value?.focus()
    nameInputRef.value?.select()
  })
}

// 保存昵称
async function saveName() {
  const newName = editName.value.trim()
  if (!newName || newName === user.value?.displayName) {
    isEditingName.value = false
    return
  }
  
  isSaving.value = true
  const ok = await authStore.updateProfile({ displayName: newName })
  isSaving.value = false
  
  if (ok) {
    toast.success(t('profile.saved'))
  } else {
    toast.error(t('profile.saveFailed'))
  }
  isEditingName.value = false
}

// 取消编辑昵称
function cancelEditName() {
  isEditingName.value = false
}

// 昵称输入按键处理
function onNameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    saveName()
  } else if (e.key === 'Escape') {
    cancelEditName()
  }
}

// 开始编辑头像
function startEditAvatar() {
  editAvatarUrl.value = user.value?.avatarUrl || ''
  isEditingAvatar.value = true
}

// 保存头像 URL
async function saveAvatar() {
  const newUrl = editAvatarUrl.value.trim()
  // 允许清空
  const avatarUrl = newUrl || null
  
  if (avatarUrl === user.value?.avatarUrl) {
    isEditingAvatar.value = false
    return
  }

  // 简单 URL 校验
  if (avatarUrl) {
    try {
      new URL(avatarUrl)
    } catch {
      toast.error(t('profile.invalidUrl'))
      return
    }
  }
  
  isSaving.value = true
  const ok = await authStore.updateProfile({ avatarUrl })
  isSaving.value = false
  
  if (ok) {
    toast.success(t('profile.saved'))
  } else {
    toast.error(t('profile.saveFailed'))
  }
  isEditingAvatar.value = false
}

// 取消编辑头像
function cancelEditAvatar() {
  isEditingAvatar.value = false
}

// 头像 URL 输入按键处理
function onAvatarKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    saveAvatar()
  } else if (e.key === 'Escape') {
    cancelEditAvatar()
  }
}

// 退出登录
async function handleLogout() {
  emit('close')
  await authStore.logout()
  router.push('/')
}

// 点击外部关闭
function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (
    panelRef.value && !panelRef.value.contains(target) &&
    props.anchor && !props.anchor.contains(target)
  ) {
    emit('close')
  }
}

// Escape 关闭
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && !isEditingName.value && !isEditingAvatar.value) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="panelRef" class="profile-panel" :class="`profile-panel--${props.placement}`">
    <!-- 头像区域 -->
    <div class="profile-avatar-section">
      <div class="profile-avatar-wrapper" @click="startEditAvatar">
        <img v-if="user?.avatarUrl" :src="user.avatarUrl" class="profile-avatar" alt="" />
        <span v-else class="profile-avatar profile-avatar--fallback">
          <UserIcon :size="24" />
        </span>
        <div class="profile-avatar-overlay">
          <Camera :size="14" />
        </div>
      </div>
    </div>

    <!-- 头像 URL 编辑 -->
    <div v-if="isEditingAvatar" class="profile-edit-row">
      <input
        v-model="editAvatarUrl"
        class="profile-input"
        :placeholder="t('profile.avatarUrlPlaceholder')"
        @keydown="onAvatarKeydown"
      />
      <div class="profile-edit-actions">
        <button class="profile-icon-btn profile-icon-btn--confirm" @click="saveAvatar" :disabled="isSaving">
          <Check :size="14" />
        </button>
        <button class="profile-icon-btn" @click="cancelEditAvatar">
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- 昵称 -->
    <div class="profile-field">
      <label class="profile-label">{{ t('profile.displayName') }}</label>
      <div v-if="isEditingName" class="profile-edit-row">
        <input
          ref="nameInputRef"
          v-model="editName"
          class="profile-input"
          :placeholder="t('profile.namePlaceholder')"
          maxlength="50"
          @keydown="onNameKeydown"
          @blur="saveName"
        />
        <div class="profile-edit-actions">
          <button class="profile-icon-btn profile-icon-btn--confirm" @click="saveName" :disabled="isSaving">
            <Check :size="14" />
          </button>
          <button class="profile-icon-btn" @click.stop="cancelEditName">
            <X :size="14" />
          </button>
        </div>
      </div>
      <div v-else class="profile-value profile-value--editable" @click="startEditName">
        {{ user?.displayName || t('profile.notSet') }}
      </div>
    </div>

    <!-- 邮箱（只读） -->
    <div class="profile-field">
      <label class="profile-label">{{ t('profile.email') }}</label>
      <div class="profile-value">{{ user?.email || '-' }}</div>
    </div>

    <!-- 分隔线 -->
    <div class="profile-divider"></div>

    <!-- 退出登录 -->
    <button class="profile-logout" @click="handleLogout">
      <LogOut :size="14" />
      <span>{{ t('layout.logout') }}</span>
    </button>
  </div>
</template>

<style scoped>
.profile-panel {
  position: absolute;
  width: 260px;
  background: var(--bg-primary);
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-4);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.profile-panel--top {
  bottom: calc(100% + var(--space-2));
  left: var(--space-3);
}

.profile-panel--bottom {
  top: calc(100% + var(--space-2));
  right: 0;
}

/* Avatar section */
.profile-avatar-section {
  display: flex;
  justify-content: center;
}

.profile-avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: var(--radius-full);
}

.profile-avatar-wrapper:hover .profile-avatar-overlay {
  opacity: 1;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.profile-avatar--fallback {
  background: var(--color-accent);
  color: var(--text-on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.profile-avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity var(--duration-fast) ease;
}

/* Fields */
.profile-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.profile-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
}

.profile-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  word-break: break-all;
}

.profile-value--editable {
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  margin: 0 calc(-1 * var(--space-2));
  border-radius: var(--radius-sm);
  transition: background var(--duration-fast) ease;
}

.profile-value--editable:hover {
  background: var(--bg-hover);
}

/* Edit row */
.profile-edit-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.profile-input {
  flex: 1;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-family: inherit;
  outline: none;
  min-width: 0;
}

.profile-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-subtle);
}

.profile-edit-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.profile-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: background var(--duration-fast) ease, color var(--duration-fast) ease;
}

.profile-icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.profile-icon-btn--confirm {
  color: var(--color-success);
}

.profile-icon-btn--confirm:hover {
  background: var(--color-success-bg, var(--bg-hover));
}

.profile-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Divider */
.profile-divider {
  height: 0.5px;
  background: var(--border-secondary);
  margin: 0 calc(-1 * var(--space-2));
}

/* Logout */
.profile-logout {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2);
  margin: 0 calc(-1 * var(--space-2));
  border-radius: var(--radius-sm);
  background: none;
  border: none;
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  font-family: inherit;
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.profile-logout:hover {
  background: var(--bg-hover);
}
</style>
