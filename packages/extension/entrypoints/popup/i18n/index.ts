import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import zhCN from '../locales/zh-CN.json'

// zh-TW, ja, ko 懒加载
const lazyLocales: Record<string, () => Promise<any>> = {
  'zh-TW': () => import('../locales/zh-TW.json'),
  ja: () => import('../locales/ja.json'),
  ko: () => import('../locales/ko.json'),
}

function detectLocale(): string {
  // 优先从 localStorage 读取（如果有的话）
  try {
    const saved = localStorage.getItem('prompttree-ext-locale')
    if (saved && ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'].includes(saved)) {
      return saved
    }
  } catch {}

  // 检测浏览器语言
  const nav = navigator.language || 'en'
  if (nav.startsWith('zh')) {
    return nav.includes('TW') || nav.includes('HK') ? 'zh-TW' : 'zh-CN'
  }
  if (nav.startsWith('ja')) return 'ja'
  if (nav.startsWith('ko')) return 'ko'
  return 'en'
}

const locale = detectLocale()

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
  },
})

// 自动加载懒加载语言包
export async function loadLocaleMessages(lang: string) {
  if (i18n.global.availableLocales.includes(lang)) return
  const loader = lazyLocales[lang]
  if (loader) {
    const messages = await loader()
    i18n.global.setLocaleMessage(lang, messages.default || messages)
  }
}

// 切换语言
export async function setLocale(lang: string) {
  await loadLocaleMessages(lang)
  ;(i18n.global.locale as any).value = lang
  try {
    localStorage.setItem('prompttree-ext-locale', lang)
  } catch {}
}

// 初始时加载检测到的语言
if (locale !== 'en' && locale !== 'zh-CN') {
  loadLocaleMessages(locale)
}

export default i18n
