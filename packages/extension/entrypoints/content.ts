import { siteAdapters, getCurrentAdapter } from '@/utils/sites'

export default defineContentScript({
  matches: [
    '*://chat.openai.com/*',
    '*://claude.ai/*',
    '*://gemini.google.com/*',
    '*://poe.com/*'
  ],
  main() {
    console.log('PromptTree content script loaded')
    
    // 监听来自 popup 的消息
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'INJECT_PROMPT') {
        const success = injectPrompt(message.text)
        sendResponse({ success })
      }
      return true
    })
  }
})

function injectPrompt(text: string): boolean {
  const adapter = getCurrentAdapter()
  if (!adapter) return false
  
  const input = adapter.getInputElement()
  if (!input) return false
  
  adapter.insertText(input, text)
  input.focus()
  return true
}
