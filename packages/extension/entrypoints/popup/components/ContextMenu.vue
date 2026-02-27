<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  nodeType: 'folder' | 'prompt'
  isFavorite: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'action', action: string): void
}>()  

const { t } = useI18n()

function handleAction(action: string) {
  emit('action', action)
  emit('close')
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent) {
  emit('close')
}

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 0)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @click.stop
  >
    <div class="menu-item" @click="handleAction('newFolder')">📁 {{ t('tree.newFolder') }}</div>
    <div class="menu-item" @click="handleAction('newPrompt')">📄 {{ t('tree.newPrompt') }}</div>
    <div class="menu-divider" />
    <div class="menu-item" @click="handleAction('rename')">✏️ {{ t('tree.rename') }}</div>
    <div class="menu-item" @click="handleAction('toggleFavorite')">
      {{ isFavorite ? '☆ ' + t('tree.unfavorite') : '⭐ ' + t('tree.addFavorite') }}
    </div>
    <template v-if="nodeType === 'prompt'">
      <div class="menu-divider" />
      <div class="menu-item" @click="handleAction('inject')">📋 {{ t('tree.inject') }}</div>
      <div class="menu-item" @click="handleAction('copy')">📎 {{ t('tree.copy') }}</div>
    </template>
    <div class="menu-divider" />
    <div class="menu-item menu-item--danger" @click="handleAction('delete')">🗑 {{ t('common.delete') }}</div>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  padding: 4px 0;
  min-width: 160px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1000;
}

.menu-item {
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  color: var(--color-text, #1f2937);
  display: flex;
  align-items: center;
  gap: 6px;
}

.menu-item:hover {
  background: var(--color-hover, #f3f4f6);
}

.menu-item--danger {
  color: #ef4444;
}

.menu-divider {
  height: 1px;
  background: var(--color-border, #e5e7eb);
  margin: 4px 0;
}
</style>
