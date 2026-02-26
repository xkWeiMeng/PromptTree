import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'prompttree-theme'

// 全局共享状态（跨组件单例）
const themeMode = ref<ThemeMode>((localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system')

/** 获取系统当前是否为暗色 */
function getSystemIsDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** 应用主题到 DOM */
function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode)
  localStorage.setItem(STORAGE_KEY, mode)
}

export function useTheme() {
  let mediaQuery: MediaQueryList | null = null
  let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null

  // 计算当前是否实际为暗色
  const isDark = computed(() => {
    if (themeMode.value === 'system') {
      return getSystemIsDark()
    }
    return themeMode.value === 'dark'
  })

  /** 设置主题模式 */
  function setTheme(mode: ThemeMode) {
    themeMode.value = mode
    applyTheme(mode)
  }

  /** 在 light / dark / system 之间循环切换 */
  function cycleTheme() {
    const order: ThemeMode[] = ['system', 'light', 'dark']
    const idx = order.indexOf(themeMode.value)
    const next = order[(idx + 1) % order.length]
    setTheme(next)
  }

  onMounted(() => {
    // 确保当前模式已应用
    applyTheme(themeMode.value)

    // 监听系统主题变化
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaHandler = () => {
      // 当系统主题变化时，如果用户选择了 "system"，强制 Vue 重新计算
      if (themeMode.value === 'system') {
        // 触发响应式更新（通过临时赋值再恢复）
        themeMode.value = 'system'
      }
    }
    mediaQuery.addEventListener('change', mediaHandler)
  })

  onBeforeUnmount(() => {
    if (mediaQuery && mediaHandler) {
      mediaQuery.removeEventListener('change', mediaHandler)
    }
  })

  return {
    themeMode,
    isDark,
    setTheme,
    cycleTheme,
  }
}
