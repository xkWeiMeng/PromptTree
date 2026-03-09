import { useCallback } from 'react'
import { messages } from './messages'
import { usePreferencesStore, type AppLocale } from '../stores/preferences'

type TranslateParams = Record<string, string | number>

interface LocaleOption {
  value: AppLocale
  labelKey: string
}

const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'en', labelKey: 'settings.languageEnglish' },
  { value: 'zh-CN', labelKey: 'settings.languageChinese' }
]

function readMessage(locale: AppLocale, key: string): string | null {
  const fallbackRoot = messages['zh-CN']
  const localeRoot = messages[locale]
  const segments = key.split('.')

  const pick = (root: Record<string, unknown>): unknown => {
    let current: unknown = root
    for (const segment of segments) {
      if (!current || typeof current !== 'object' || !(segment in current)) {
        return null
      }
      current = (current as Record<string, unknown>)[segment]
    }
    return current
  }

  const localized = pick(localeRoot as Record<string, unknown>)
  if (typeof localized === 'string') {
    return localized
  }

  const fallback = pick(fallbackRoot as Record<string, unknown>)
  return typeof fallback === 'string' ? fallback : null
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key]
    return value === undefined ? `{${key}}` : String(value)
  })
}

export function translate(locale: AppLocale, key: string, params?: TranslateParams): string {
  const template = readMessage(locale, key)
  if (!template) return key
  return interpolate(template, params)
}

export function useI18n() {
  const locale = usePreferencesStore(s => s.locale)
  const setLocale = usePreferencesStore(s => s.setLocale)

  const t = useCallback((key: string, params?: TranslateParams) => {
    return translate(locale, key, params)
  }, [locale])

  const localeOptions = LOCALE_OPTIONS.map(option => ({
    value: option.value,
    label: t(option.labelKey)
  }))

  return {
    locale,
    setLocale,
    localeOptions,
    t
  }
}
