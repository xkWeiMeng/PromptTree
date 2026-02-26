import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'PromptTree',
        short_name: 'PromptTree',
        description: 'Prompt 管理工具 - 树形结构、变量填充、离线优先',
        theme_color: '#007AFF',
        background_color: '#F5F5F7',
        display: 'standalone',
        start_url: '/app',
        scope: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        // 缓存静态资源
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // API 请求使用 NetworkFirst 策略（优先网络，离线时使用缓存）
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/sync/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'api-sync'
            }
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // 开发模式下禁用 PWA
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
