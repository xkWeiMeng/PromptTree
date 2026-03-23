import { nextTick } from 'vue'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import FeaturesPage from '@/views/FeaturesPage.vue'

const EXPECTED_SCENES = [
  'tree',
  'variable',
  'offline',
  'sync',
  'extension',
  'share',
  'api',
  'mindmap',
  'outline',
  'dark',
  'keyboard',
] as const

async function mountFeaturesPage() {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    missingWarn: false,
    fallbackWarn: false,
    messages: {
      en: {
        seo: {
          siteDesc: 'PromptTree'
        },
        features: {}
      }
    }
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:locale(en|zh-CN|zh-TW|ja|ko)/features', component: FeaturesPage },
      { path: '/app', component: { template: '<div />' } }
    ]
  })

  await router.push('/en/features')
  await router.isReady()

  const wrapper = mount(FeaturesPage, {
    global: {
      plugins: [router, i18n],
      stubs: {
        SiteLayout: { template: '<div><slot /></div>' },
        RouterLink: RouterLinkStub
      }
    }
  })

  await nextTick()
  await nextTick()

  return wrapper
}

describe('FeaturesPage 场景图渲染', () => {
  it('应该为每个功能卖点渲染对应场景 SVG', async () => {
    const wrapper = await mountFeaturesPage()
    const renderedScenes = wrapper.findAll('svg[data-scene]').map((el) => el.attributes('data-scene'))

    expect(renderedScenes).toHaveLength(EXPECTED_SCENES.length)
    expect(new Set(renderedScenes)).toEqual(new Set(EXPECTED_SCENES))

    wrapper.unmount()
  })

  it('不应该渲染兜底场景', async () => {
    const wrapper = await mountFeaturesPage()

    expect(wrapper.find('svg[data-scene="fallback"]').exists()).toBe(false)

    wrapper.unmount()
  })
})
