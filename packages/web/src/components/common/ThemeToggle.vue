<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/composables/useTheme'

const props = withDefaults(defineProps<{
  placement?: 'bottom' | 'top'
}>(), {
  placement: 'bottom',
})

const { t } = useI18n()
const { themeMode, setTheme } = useTheme()

const open = ref(false)
const toggleRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(-1)

const options: { mode: ThemeMode; icon: typeof Sun; labelKey: string }[] = [
  { mode: 'system', icon: Monitor, labelKey: 'theme.system' },
  { mode: 'light', icon: Sun, labelKey: 'theme.light' },
  { mode: 'dark', icon: Moon, labelKey: 'theme.dark' },
]

function select(mode: ThemeMode) {
  setTheme(mode)
  open.value = false
}

function toggleMenu() {
  open.value = !open.value
  if (open.value) {
    focusedIndex.value = options.findIndex(o => o.mode === themeMode.value)
    if (focusedIndex.value === -1) focusedIndex.value = 0
    nextTick(() => focusMenuItem(focusedIndex.value))
  }
}

function focusMenuItem(index: number) {
  const items = menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]')
  items?.[index]?.focus()
}

function onMenuKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault()
    focusedIndex.value = (focusedIndex.value + 1) % options.length
    focusMenuItem(focusedIndex.value)
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault()
    focusedIndex.value = (focusedIndex.value - 1 + options.length) % options.length
    focusMenuItem(focusedIndex.value)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    open.value = false
    toggleRef.value?.querySelector('button')?.focus()
  } else if (e.key === 'Home') {
    e.preventDefault()
    focusedIndex.value = 0
    focusMenuItem(0)
  } else if (e.key === 'End') {
    e.preventDefault()
    focusedIndex.value = options.length - 1
    focusMenuItem(focusedIndex.value)
  }
}

function onClickOutside(e: MouseEvent) {
  if (open.value && toggleRef.value && !toggleRef.value.contains(e.target as Node)) {
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
  <div ref="toggleRef" class="theme-toggle">
    <button
      class="theme-toggle__trigger"
      :title="t('theme.label')"
      :aria-label="t('theme.label')"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="toggleMenu"
    >
      <Transition name="theme-icon" mode="out-in">
        <Sun v-if="themeMode === 'light'" :size="16" key="sun" />
        <Moon v-else-if="themeMode === 'dark'" :size="16" key="moon" />
        <Monitor v-else :size="16" key="monitor" />
      </Transition>
    </button>

    <Transition :name="placement === 'top' ? 'dropdown-up' : 'dropdown'">
      <div
        v-if="open"
        ref="menuRef"
        class="theme-toggle__menu"
        :class="`theme-toggle__menu--${placement}`"
        role="menu"
        :aria-label="t('theme.label')"
        @keydown="onMenuKeydown"
      >
        <button
          v-for="opt in options"
          :key="opt.mode"
          role="menuitem"
          class="theme-toggle__item"
          :class="{ 'theme-toggle__item--active': themeMode === opt.mode }"
          @click="select(opt.mode)"
        >
          <component :is="opt.icon" :size="14" />
          <span>{{ t(opt.labelKey) }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.theme-toggle {
  position: relative;
}

.theme-toggle__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) ease;
}

.theme-toggle__trigger:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
  border-color: var(--border-primary);
}

.theme-toggle__menu {
  position: absolute;
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

.theme-toggle__menu--bottom {
  top: calc(100% + var(--space-1));
}

.theme-toggle__menu--top {
  bottom: calc(100% + var(--space-1));
}

.theme-toggle__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

.theme-toggle__item:hover {
  background: var(--bg-hover);
}

.theme-toggle__item--active {
  color: var(--color-accent);
  font-weight: var(--font-weight-medium);
}

/* Icon switch animation */
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
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

/* Dropdown-up animation (for top placement) */
.dropdown-up-enter-active {
  transition: opacity var(--duration-fast) ease, transform var(--duration-fast) ease;
}

.dropdown-up-leave-active {
  transition: opacity var(--duration-fast) ease, transform var(--duration-fast) ease;
}

.dropdown-up-enter-from,
.dropdown-up-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
