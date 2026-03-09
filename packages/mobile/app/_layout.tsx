import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { initDatabase } from '../db/index'
import { useAuthStore } from '../stores/auth'
import { useTreeStore } from '../stores/tree'
import { useSyncStore } from '../stores/sync'
import { usePreferencesStore } from '../stores/preferences'
import { useI18n } from '../i18n'
import { extractErrorFromUrl, extractTokenFromUrl } from '../utils/auth'
import { useTheme } from '../utils/theme'

export default function RootLayout() {
  const router = useRouter()
  const pathname = usePathname()
  const [dbReady, setDbReady] = useState(false)
  const { t } = useI18n()
  const { colors, resolvedTheme } = useTheme()

  const checkAuth = useAuthStore(s => s.checkAuth)
  const handleToken = useAuthStore(s => s.handleToken)
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  const isOfflineMode = useAuthStore(s => s.isOfflineMode)

  const loadNodes = useTreeStore(s => s.loadNodes)

  const restoreSyncTime = useSyncStore(s => s.restoreSyncTime)
  const fullSync = useSyncStore(s => s.fullSync)
  const startPeriodicSync = useSyncStore(s => s.startPeriodicSync)
  const stopPeriodicSync = useSyncStore(s => s.stopPeriodicSync)
  const hydratePreferences = usePreferencesStore(s => s.hydratePreferences)

  useEffect(() => {
    let disposed = false

    const initialize = async () => {
      initDatabase()
      hydratePreferences()
      await checkAuth()
      restoreSyncTime()
      loadNodes()

      const authState = useAuthStore.getState()
      if (!authState.isLoggedIn && !authState.isOfflineMode) {
        router.replace('/login')
      }

      if (!disposed) {
        setDbReady(true)
      }
    }

    void initialize()

    return () => {
      disposed = true
      stopPeriodicSync()
    }
  }, [checkAuth, hydratePreferences, loadNodes, restoreSyncTime, router, stopPeriodicSync])

  const processAuthCallback = useCallback(async (url: string) => {
    const error = extractErrorFromUrl(url)
    if (error) {
      router.replace({
        pathname: '/login',
        params: { error }
      })
      return
    }

    const token = extractTokenFromUrl(url)
    if (!token) return

    const success = await handleToken(token)
    if (success) {
      router.replace('/(tabs)')
      await fullSync()
      return
    }

    router.replace({
      pathname: '/login',
      params: { error: 'token_failed' }
    })
  }, [fullSync, handleToken, router])

  useEffect(() => {
    let isActive = true

    const readInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL()
        if (isActive && initialUrl) {
          await processAuthCallback(initialUrl)
        }
      } catch (error) {
        console.error('读取初始 Deep Link 失败:', error)
      }
    }

    void readInitialUrl()

    const subscription = Linking.addEventListener('url', (event) => {
      void processAuthCallback(event.url)
    })

    return () => {
      isActive = false
      subscription.remove()
    }
  }, [processAuthCallback])

  useEffect(() => {
    if (isLoggedIn && !isOfflineMode) {
      startPeriodicSync()
      void fullSync()
      return () => stopPeriodicSync()
    }

    stopPeriodicSync()
    return undefined
  }, [fullSync, isLoggedIn, isOfflineMode, startPeriodicSync, stopPeriodicSync])

  useEffect(() => {
    if (!dbReady) return

    const isLoginRoute = pathname === '/login'
    const isAccountRoute = pathname === '/profile'
    const canAccessWorkspace = isLoggedIn || isOfflineMode

    if (isAccountRoute && !isLoggedIn) {
      router.replace('/login')
      return
    }

    if (!canAccessWorkspace && !isLoginRoute) {
      router.replace('/login')
      return
    }

    if (isLoggedIn && isLoginRoute) {
      router.replace('/(tabs)')
    }
  }, [dbReady, isLoggedIn, isOfflineMode, pathname, router])

  if (!dbReady) return null

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="prompt/[id]" options={{ title: t('common.untitledPrompt') }} />
        <Stack.Screen name="prompt/new" options={{ title: t('tree.newPrompt') }} />
        <Stack.Screen name="folder/[id]" options={{ title: t('common.untitledFolder') }} />
        <Stack.Screen name="outline" options={{ title: t('modeSwitcher.outline') }} />
        <Stack.Screen name="mindmap" options={{ title: t('modeSwitcher.mindmap') }} />
        <Stack.Screen name="profile" options={{ title: t('profile.title') }} />
        <Stack.Screen
          name="login"
          options={{ title: t('login.login'), headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen name="search" options={{ title: t('workspace.searchTitle') }} />
      </Stack>
    </>
  )
}
