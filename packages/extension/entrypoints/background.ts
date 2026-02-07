export default defineBackground(() => {
  console.log('PromptTree background script loaded')
  
  // 监听快捷键
  browser.commands.onCommand.addListener((command) => {
    if (command === 'open-popup') {
      // 打开 popup 或执行其他操作
    }
  })
  
  // 定时同步
  setInterval(async () => {
    // TODO: 后台同步数据
  }, 5 * 60 * 1000) // 每 5 分钟
})
