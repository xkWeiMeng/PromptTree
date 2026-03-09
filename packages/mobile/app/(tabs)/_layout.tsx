import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import SyncStatusBar from '../../components/SyncStatusBar'
import { useI18n } from '../../i18n'
import { useTheme } from '../../utils/theme'

export default function TabLayout() {
  const { t } = useI18n()
  const { colors } = useTheme()

  return (
    <>
      <SyncStatusBar />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.workspace'),
            tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text>
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: t('tabs.favorites'),
            tabBarIcon: ({ color }) => <Text style={{ color }}>⭐</Text>
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color }) => <Text style={{ color }}>⚙️</Text>
          }}
        />
      </Tabs>
    </>
  )
}
