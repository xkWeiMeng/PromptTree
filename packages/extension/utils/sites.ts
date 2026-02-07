/**
 * 网站适配器
 * 支持多个 AI 聊天网站
 */

export interface SiteAdapter {
  name: string
  match: RegExp
  getInputElement: () => HTMLElement | null
  insertText: (element: HTMLElement, text: string) => void
}

export const siteAdapters: SiteAdapter[] = [
  {
    name: 'ChatGPT',
    match: /chat\.openai\.com/,
    getInputElement: () => document.querySelector('#prompt-textarea') as HTMLElement,
    insertText: (el, text) => {
      el.textContent = text
      el.dispatchEvent(new InputEvent('input', { bubbles: true }))
    }
  },
  {
    name: 'Claude',
    match: /claude\.ai/,
    getInputElement: () => document.querySelector('[contenteditable="true"]') as HTMLElement,
    insertText: (el, text) => {
      el.innerHTML = `<p>${text}</p>`
      el.dispatchEvent(new InputEvent('input', { bubbles: true }))
    }
  },
  {
    name: 'Gemini',
    match: /gemini\.google\.com/,
    getInputElement: () => document.querySelector('.ql-editor') as HTMLElement,
    insertText: (el, text) => {
      el.innerHTML = `<p>${text}</p>`
      el.dispatchEvent(new InputEvent('input', { bubbles: true }))
    }
  },
  {
    name: 'Poe',
    match: /poe\.com/,
    getInputElement: () => document.querySelector('textarea') as HTMLElement,
    insertText: (el, text) => {
      (el as HTMLTextAreaElement).value = text
      el.dispatchEvent(new InputEvent('input', { bubbles: true }))
    }
  }
]

export function getCurrentAdapter(): SiteAdapter | null {
  const url = window.location.href
  return siteAdapters.find(a => a.match.test(url)) ?? null
}
