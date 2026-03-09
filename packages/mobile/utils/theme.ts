import { useMemo } from 'react'
import { useColorScheme, type ColorSchemeName } from 'react-native'
import { usePreferencesStore, type ThemeMode } from '../stores/preferences'

export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryBg: string
  background: string
  surface: string
  text: string
  textSecondary: string
  textTertiary: string
  border: string
  borderLight: string
  danger: string
  dangerBg: string
  success: string
  successBg: string
  warning: string
  warningBg: string
  overlay: string
}

const lightColors: ThemeColors = {
  primary: '#4f46e5',
  primaryLight: '#818cf8',
  primaryBg: '#eef2ff',
  background: '#ffffff',
  surface: '#f9fafb',
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  success: '#22c55e',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  overlay: 'rgba(0, 0, 0, 0.4)',
}

const darkColors: ThemeColors = {
  primary: '#818cf8',
  primaryLight: '#a5b4fc',
  primaryBg: '#312e81',
  background: '#111827',
  surface: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  border: '#374151',
  borderLight: '#4b5563',
  danger: '#f87171',
  dangerBg: '#7f1d1d',
  success: '#4ade80',
  successBg: '#14532d',
  warning: '#fbbf24',
  warningBg: '#78350f',
  overlay: 'rgba(0, 0, 0, 0.55)',
}
export type ResolvedTheme = 'light' | 'dark'

// 兼容旧引用（未迁移组件会继续使用浅色主题）
export const colors = lightColors

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
} as const

function resolveTheme(themeMode: ThemeMode, systemScheme: ColorSchemeName): ResolvedTheme {
  if (themeMode === 'light' || themeMode === 'dark') {
    return themeMode
  }
  return systemScheme === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const themeMode = usePreferencesStore(s => s.themeMode)
  const systemScheme = useColorScheme()

  const resolvedTheme = resolveTheme(themeMode, systemScheme)
  const themeColors = resolvedTheme === 'dark' ? darkColors : lightColors

  return {
    colors: themeColors,
    isDark: resolvedTheme === 'dark',
    resolvedTheme,
    themeMode,
  }
}

export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors: themeColors } = useTheme()
  return useMemo(() => factory(themeColors), [factory, themeColors])
}
