/**
 * 网站适配器
 * 支持多个 AI 聊天网站
 */

export interface SiteAdapter {
  name: string
  match: RegExp
  getInputElement: () => HTMLElement | null
  insertText: (element: HTMLElement, text: string) => void
  /** 检查输入框是否就绪 */
  isReady: () => boolean
  /** 等待输入框出现，最多等 timeout 毫秒 */
  waitForInput: (timeout?: number) => Promise<HTMLElement | null>
}

function defaultWaitForInput(adapter: Pick<SiteAdapter, 'getInputElement'>, timeout = 5000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const el = adapter.getInputElement()
    if (el) return resolve(el)

    const interval = 200
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed += interval
      const found = adapter.getInputElement()
      if (found) {
        clearInterval(timer)
        resolve(found)
      } else if (elapsed >= timeout) {
        clearInterval(timer)
        resolve(null)
      }
    }, interval)
  })
}

export const siteAdapters: SiteAdapter[] = [
  {
    name: 'ChatGPT',
    match: /chat\.openai\.com|chatgpt\.com/,
    getInputElement: () =>
      (document.querySelector('#prompt-textarea') ||
       document.querySelector('[contenteditable="true"][data-id="root"]')) as HTMLElement | null,
    insertText: (el, text) => {
      if (el.tagName === 'TEXTAREA') {
        (el as HTMLTextAreaElement).value = text
      } else {
        el.innerHTML = `<p>${text}</p>`
      }
      el.dispatchEvent(new InputEvent('input', { bubbles: true }))
    },
    isReady() { return !!this.getInputElement() },
    waitForInput(timeout) { return defaultWaitForInput(this, timeout) }
  },
  {
    name: 'Claude',
    match: /claude\.ai/,
    getInputElement: () =>
      (document.querySelector('[contenteditable="true"].ProseMirror') ||
       document.querySelector('[contenteditable="true"]')) as HTMLElement | null,
    insertText: (el, text) => {
      el.innerHTML = `<p>${text}</p>`
      el.dispatchEvent(new InputEvent('input', { bubbles: true }))
    },
    isReady() { return !!this.getInputElement() },
    waitForInput(timeout) { return defaultWaitForInput(this, timeout) }
  },
  {
    name: 'Gemini',
    match: /gemini\.google\.com/,
    getInputElement: () =>
      (document.querySelector('.ql-editor') ||
       document.querySelector('[contenteditable="true"]')) as HTMLElement | null,
    insertText: (el, text) => {
      el.innerHTML = `<p>${text}</p>`
      el.dispatchEvent(new InputEvent('input', { bubbles: true }))
    },
    isReady() { return !!this.getInputElement() },
    waitForInput(timeout) { return defaultWaitForInput(this, timeout) }
  },
  {
    name: 'Poe',
    match: /poe\.com/,
    getInputElement: () =>
      (document.querySelector('textarea[class*="ChatInput"]') ||
       document.querySelector('textarea')) as HTMLElement | null,
    insertText: (el, text) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set
      if (nativeSetter) {
        nativeSetter.call(el, text)
      } else {
        (el as HTMLTextAreaElement).value = text
      }
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    },
    isReady() { return !!this.getInputElement() },
    waitForInput(timeout) { return defaultWaitForInput(this, timeout) }
  }
]

export function getCurrentAdapter(): SiteAdapter | null {
  const url = window.location.href
  return siteAdapters.find(a => a.match.test(url)) ?? null
}

/**
 * 获取当前网站信息
 */
export function getSiteInfo(): { name: string; url: string; ready: boolean } | null {
  const adapter = getCurrentAdapter()
  if (!adapter) return null
  return {
    name: adapter.name,
    url: window.location.href,
    ready: adapter.isReady()
  }
}
