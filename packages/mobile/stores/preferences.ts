import { create } from 'zustand'
import { META_KEYS } from '../db/index'
import * as dbOps from '../db/operations'

export const SUPPORTED_LOCALES = ['en', 'zh-CN'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const THEME_MODES = ['system', 'light', 'dark'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

interface PreferencesState {
  locale: AppLocale
  themeMode: ThemeMode
  hydrated: boolean
}

interface PreferencesActions {
  hydratePreferences: () => void
  setLocale: (locale: AppLocale) => void
  setThemeMode: (mode: ThemeMode) => void
}

function isSupportedLocale(value: string | null): value is AppLocale {
  return value === 'en' || value === 'zh-CN'
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

function detectSystemLocale(): AppLocale {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase()
  if (locale.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en'
}

const defaultLocale = detectSystemLocale()

export const usePreferencesStore = create<PreferencesState & PreferencesActions>((set) => ({
  locale: defaultLocale,
  themeMode: 'system',
  hydrated: false,

  hydratePreferences: () => {
    const storedLocale = dbOps.getMetaValue(META_KEYS.LOCALE)
    const storedThemeMode = dbOps.getMetaValue(META_KEYS.THEME_MODE)

    const locale = isSupportedLocale(storedLocale) ? storedLocale : defaultLocale
    const themeMode = isThemeMode(storedThemeMode) ? storedThemeMode : 'system'

    dbOps.setMetaValue(META_KEYS.LOCALE, locale)
    dbOps.setMetaValue(META_KEYS.THEME_MODE, themeMode)

    set({
      locale,
      themeMode,
      hydrated: true
    })
  },

  setLocale: (locale) => {
    dbOps.setMetaValue(META_KEYS.LOCALE, locale)
    set({ locale })
  },

  setThemeMode: (themeMode) => {
    dbOps.setMetaValue(META_KEYS.THEME_MODE, themeMode)
    set({ themeMode })
  }
}))
