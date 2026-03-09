import React, { useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/auth'
import { useSyncStore } from '../../stores/sync'
import { useTreeStore } from '../../stores/tree'
import { usePreferencesStore, type ThemeMode } from '../../stores/preferences'
import * as dbOps from '../../db/operations'
import UserCard from '../../components/UserCard'
import { useI18n } from '../../i18n'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../../utils/theme'

export default function SettingsScreen() {
  const router = useRouter()
  const { t, locale, setLocale, localeOptions } = useI18n()
  const { colors, themeMode } = useTheme()
  const setThemeMode = usePreferencesStore(s => s.setThemeMode)
  const styles = useThemedStyles(createStyles)
  const user = useAuthStore(s => s.user)
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  const logout = useAuthStore(s => s.logout)
  const syncStatus = useSyncStore(s => s.syncStatus)
  const lastSyncTime = useSyncStore(s => s.lastSyncTime)
  const triggerSync = useSyncStore(s => s.triggerSync)
  const fullSync = useSyncStore(s => s.fullSync)
  const nodes = useTreeStore(s => s.nodes)
  const loadNodes = useTreeStore(s => s.loadNodes)

  // 待同步数量
  const dirtyCount = dbOps.getDirtyNodes().length

  // 手动同步
  const handleSync = useCallback(() => {
    triggerSync()
  }, [triggerSync])

  // 全量同步
  const handleFullSync = useCallback(() => {
    Alert.alert(
      t('settings.fullSyncTitle'),
      t('settings.fullSyncMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => fullSync() },
      ]
    )
  }, [fullSync, t])

  // 清除缓存
  const handleClearCache = useCallback(() => {
    Alert.alert(
      t('settings.clearCacheTitle'),
      t('settings.clearCacheMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.clearCache'),
          style: 'destructive',
          onPress: () => {
            dbOps.clearAllNodes()
            loadNodes()
          },
        },
      ]
    )
  }, [loadNodes, t])

  // 退出登录
  const handleLogout = useCallback(() => {
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: () => {
          logout()
          router.replace('/login')
        },
      },
    ])
  }, [logout, router, t])

  // 跳转登录
  const handleLogin = useCallback(() => {
    router.push('/login')
  }, [router])

  const handleOpenProfile = useCallback(() => {
    router.push('/profile')
  }, [router])

  const handleThemeModeChange = useCallback((mode: ThemeMode) => {
    setThemeMode(mode)
  }, [setThemeMode])

  const formatTime = (ts: number) => {
    if (!ts) return t('settings.never')
    return new Date(ts).toLocaleString(locale)
  }

  const SettingRow = ({
    label,
    value,
    last,
  }: {
    label: string
    value: string
    last?: boolean
  }) => (
    <View style={[styles.settingRow, last && styles.lastRow]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  )

  const PreferenceRow = ({
    label,
    children,
    last,
  }: {
    label: string
    children: React.ReactNode
    last?: boolean
  }) => (
    <View style={[styles.settingRow, styles.preferenceRow, last && styles.lastRow]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.optionsGroup}>{children}</View>
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 用户信息 */}
      {isLoggedIn && user ? (
        <UserCard user={user} />
      ) : (
        <Pressable style={styles.loginCard} onPress={handleLogin}>
          <Text style={styles.loginIcon}>👤</Text>
          <View style={styles.loginInfo}>
            <Text style={styles.loginTitle}>{t('settings.loginAccount')}</Text>
            <Text style={styles.loginSubtitle}>{t('settings.loginSyncHint')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}

      {/* 数据统计 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
        <View style={styles.card}>
          <SettingRow label={t('settings.totalNodes')} value={`${nodes.filter(n => !n.deletedAt).length}`} />
          <SettingRow
            label={t('settings.folders')}
            value={`${nodes.filter(n => n.type === 'folder' && !n.deletedAt).length}`}
          />
          <SettingRow
            label={t('settings.prompts')}
            value={`${nodes.filter(n => n.type === 'prompt' && !n.deletedAt).length}`}
          />
          <SettingRow
            label={t('settings.favorites')}
            value={`${nodes.filter(n => n.isFavorite && !n.deletedAt).length}`}
            last
          />
        </View>
      </View>

      {/* 同步 */}
      {isLoggedIn && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sync')}</Text>
          <View style={styles.card}>
            <SettingRow label={t('settings.syncStatus')} value={syncStatusLabel(syncStatus, t)} />
            <SettingRow label={t('settings.lastSync')} value={formatTime(lastSyncTime)} />
            <SettingRow label={t('settings.pendingSync')} value={t('settings.pendingItems', { count: dirtyCount })} last />
          </View>
          <View style={styles.buttonGroup}>
            <Pressable style={styles.actionBtn} onPress={handleSync}>
              <Text style={styles.actionBtnText}>{t('settings.manualSync')}</Text>
            </Pressable>
            <Pressable style={styles.actionBtnSecondary} onPress={handleFullSync}>
              <Text style={styles.actionBtnSecondaryText}>{t('settings.fullSync')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
        <View style={styles.card}>
          <PreferenceRow label={t('settings.language')}>
            {localeOptions.map(option => (
              <Pressable
                key={option.value}
                style={[
                  styles.optionChip,
                  locale === option.value && styles.optionChipActive
                ]}
                onPress={() => setLocale(option.value)}
              >
                <Text style={[
                  styles.optionChipText,
                  locale === option.value && styles.optionChipTextActive
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </PreferenceRow>

          <PreferenceRow label={t('theme.label')} last>
            {(['system', 'light', 'dark'] as ThemeMode[]).map(mode => (
              <Pressable
                key={mode}
                style={[
                  styles.optionChip,
                  themeMode === mode && styles.optionChipActive
                ]}
                onPress={() => handleThemeModeChange(mode)}
              >
                <Text style={[
                  styles.optionChipText,
                  themeMode === mode && styles.optionChipTextActive
                ]}>
                  {t(`theme.${mode}`)}
                </Text>
              </Pressable>
            ))}
          </PreferenceRow>
        </View>
      </View>

      {/* 操作 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.actions')}</Text>
        <View style={styles.card}>
          {isLoggedIn && (
            <Pressable style={styles.settingRow} onPress={handleOpenProfile}>
              <Text style={styles.settingLabel}>{t('settings.accountApiKey')}</Text>
              <Text style={styles.settingValue}>›</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.settingRow, !isLoggedIn && styles.lastRow]}
            onPress={handleClearCache}
          >
            <Text style={styles.dangerText}>{t('settings.clearCache')}</Text>
          </Pressable>
          {isLoggedIn && (
            <Pressable style={[styles.settingRow, styles.lastRow]} onPress={handleLogout}>
              <Text style={styles.dangerText}>{t('settings.logout')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 关于 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.card}>
          <SettingRow label={t('settings.version')} value="1.0.0" last />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('settings.footerTagline')}</Text>
      </View>
    </ScrollView>
  )
}

// ===================
// 辅助组件
// ===================

function syncStatusLabel(
  status: string,
  t: (key: string) => string
): string {
  switch (status) {
    case 'syncing':
      return t('sync.syncing')
    case 'success':
      return t('sync.synced')
    case 'error':
      return t('sync.error')
    default:
      return t('sync.idle')
  }
}

// ===================
// 样式
// ===================

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loginIcon: {
    fontSize: 36,
  },
  loginInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  loginTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  loginSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    paddingLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  preferenceRow: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  optionsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  optionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  optionChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  optionChipTextActive: {
    color: colors.primary,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  settingValue: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  dangerText: {
    fontSize: fontSize.md,
    color: colors.danger,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: '#ffffff',
  },
  actionBtnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
})
