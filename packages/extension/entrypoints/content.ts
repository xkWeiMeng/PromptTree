import { getCurrentAdapter, getSiteInfo } from '@/utils/sites'

export default defineContentScript({
  matches: [
    '*://chat.openai.com/*',
    '*://chatgpt.com/*',
    '*://claude.ai/*',
    '*://gemini.google.com/*',
    '*://poe.com/*'
  ],
  main() {
    console.log('[PromptTree] content script loaded on', window.location.href)

    // 监听来自 popup / background 的消息
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.type) {
        case 'INJECT_PROMPT':
          injectPrompt(message.text).then((success) => {
            sendResponse({ success })
          })
          return true // async response

        case 'GET_SITE_INFO':
          sendResponse(getSiteInfo())
          return false

        default:
          return false
      }
    })
  }
})

async function injectPrompt(text: string): Promise<boolean> {
  const adapter = getCurrentAdapter()
  if (!adapter) return false

  // 等待输入框就绪
  let input = adapter.getInputElement()
  if (!input) {
    input = await adapter.waitForInput(3000)
  }
  if (!input) return false

  try {
    adapter.insertText(input, text)
    input.focus()
    return true
  } catch (err) {
    console.error('[PromptTree] inject failed:', err)
    return false
  }
}
