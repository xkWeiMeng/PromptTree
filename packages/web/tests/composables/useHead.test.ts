import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent, h, nextTick } from 'vue'
import { useHead } from '@/composables/useHead'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        seo: { siteDesc: 'PromptTree 描述' }
      }
    }
  })
}

async function mountWithHead(path: string, options: Parameters<typeof useHead>[0]) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:locale(en|zh-CN|zh-TW|ja|ko)/docs', component: { template: '<div />' } },
      { path: '/app', component: { template: '<div />' } }
    ]
  })
  const i18n = createTestI18n()

  await router.push(path)
  await router.isReady()

  const TestComponent = defineComponent({
    setup() {
      useHead(options)
      return () => h('div')
    }
  })

  const wrapper = mount(TestComponent, {
    global: {
      plugins: [router, i18n]
    }
  })

  await nextTick()
  await nextTick()

  return { wrapper }
}

describe('useHead', () => {
  beforeEach(() => {
    document.title = 'PromptTree'
    document.head.innerHTML = '<meta name="description" content=""><meta name="robots" content="index, follow">'
  })

  it('应该在 canonical 中移除 query 参数和 hash', async () => {
    const { wrapper } = await mountWithHead('/en/docs?utm_source=ad#section', {
      title: '文档页'
    })

    const canonical = document.querySelector('link[rel="canonical"]')
    const ogUrl = document.querySelector('meta[property="og:url"]')

    expect(canonical?.getAttribute('href')).toBe('https://prompttree.app/en/docs')
    expect(ogUrl?.getAttribute('content')).toBe('https://prompttree.app/en/docs')
    wrapper.unmount()
  })

  it('应该允许页面覆盖 robots 为 noindex', async () => {
    const { wrapper } = await mountWithHead('/app', {
      title: '工作台',
      robots: 'noindex, nofollow'
    })

    const robots = document.querySelector('meta[name="robots"]')
    const alternates = document.querySelectorAll('link[rel="alternate"][hreflang]')

    expect(robots?.getAttribute('content')).toBe('noindex, nofollow')
    expect(alternates.length).toBe(0)
    wrapper.unmount()
  })

  it('应该仅在 locale 页面生成 hreflang 标签', async () => {
    const { wrapper } = await mountWithHead('/zh-CN/docs', {
      title: '文档'
    })

    const alternates = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'))
    const getHref = (lang: string) => alternates.find((el) => el.getAttribute('hreflang') === lang)?.getAttribute('href')

    expect(alternates).toHaveLength(6)
    expect(getHref('en')).toBe('https://prompttree.app/en/docs')
    expect(getHref('zh-CN')).toBe('https://prompttree.app/zh-CN/docs')
    expect(getHref('x-default')).toBe('https://prompttree.app/en/docs')
    wrapper.unmount()
  })
})
