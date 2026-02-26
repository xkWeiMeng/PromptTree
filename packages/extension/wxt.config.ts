import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'PromptTree',
    description: 'Prompt 管理与一键填入',
    icons: {
      '16': 'icon-16.svg',
      '48': 'icon-48.svg',
      '128': 'icon-128.svg'
    },
    permissions: ['storage', 'activeTab'],
    host_permissions: [
      '*://chat.openai.com/*',
      '*://claude.ai/*',
      '*://gemini.google.com/*',
      '*://poe.com/*'
    ],
    commands: {
      'open-popup': {
        suggested_key: {
          default: 'Ctrl+Shift+P',
          mac: 'Command+Shift+P'
        },
        description: '打开 PromptTree'
      }
    }
  }
})
