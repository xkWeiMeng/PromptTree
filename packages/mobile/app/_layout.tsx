import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { initDatabase } from '../db/index'
import { useAuthStore } from '../stores/auth'
import { useTreeStore } from '../stores/tree'

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false)
  const checkAuth = useAuthStore(s => s.checkAuth)
  const loadNodes = useTreeStore(s => s.loadNodes)

  useEffect(() => {
    // 初始化数据库 → 恢复认证状态 → 加载节点
    initDatabase()
    setDbReady(true)
    checkAuth()
    loadNodes()
  }, [])

  if (!dbReady) return null

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="prompt/[id]" options={{ title: 'Prompt' }} />
        <Stack.Screen name="prompt/new" options={{ title: '新建 Prompt' }} />
        <Stack.Screen name="folder/[id]" options={{ title: '文件夹' }} />
        <Stack.Screen name="login" options={{ title: '登录', headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="search" options={{ title: '搜索' }} />
      </Stack>
    </>
  )
}
