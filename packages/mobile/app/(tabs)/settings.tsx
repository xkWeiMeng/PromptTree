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
import * as dbOps from '../../db/operations'
import UserCard from '../../components/UserCard'
import { colors, spacing, fontSize } from '../../utils/theme'

export default function SettingsScreen() {
  const router = useRouter()
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
      '全量同步',
      '将从服务端拉取所有数据覆盖本地，确定继续？',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: () => fullSync() },
      ]
    )
  }, [fullSync])

  // 清除缓存
  const handleClearCache = useCallback(() => {
    Alert.alert(
      '清除本地缓存',
      '将清除所有本地数据，需要重新同步。确定继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: () => {
            dbOps.clearAllNodes()
            loadNodes()
          },
        },
      ]
    )
  }, [loadNodes])

  // 退出登录
  const handleLogout = useCallback(() => {
    Alert.alert('退出登录', '确定要退出吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          logout()
          router.replace('/login')
        },
      },
    ])
  }, [logout, router])

  // 跳转登录
  const handleLogin = useCallback(() => {
    router.push('/login')
  }, [router])

  const formatTime = (ts: number) => {
    if (!ts) return '从未'
    return new Date(ts).toLocaleString('zh-CN')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 用户信息 */}
      {isLoggedIn && user ? (
        <UserCard user={user} />
      ) : (
        <Pressable style={styles.loginCard} onPress={handleLogin}>
          <Text style={styles.loginIcon}>👤</Text>
          <View style={styles.loginInfo}>
            <Text style={styles.loginTitle}>登录账号</Text>
            <Text style={styles.loginSubtitle}>登录后数据云端同步</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}

      {/* 数据统计 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据</Text>
        <View style={styles.card}>
          <SettingRow label="总节点数" value={`${nodes.filter(n => !n.deletedAt).length}`} />
          <SettingRow
            label="文件夹"
            value={`${nodes.filter(n => n.type === 'folder' && !n.deletedAt).length}`}
          />
          <SettingRow
            label="Prompt"
            value={`${nodes.filter(n => n.type === 'prompt' && !n.deletedAt).length}`}
          />
          <SettingRow
            label="收藏"
            value={`${nodes.filter(n => n.isFavorite && !n.deletedAt).length}`}
            last
          />
        </View>
      </View>

      {/* 同步 */}
      {isLoggedIn && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>同步</Text>
          <View style={styles.card}>
            <SettingRow label="同步状态" value={syncStatusLabel(syncStatus)} />
            <SettingRow label="上次同步" value={formatTime(lastSyncTime)} />
            <SettingRow label="待同步" value={`${dirtyCount} 项`} last />
          </View>
          <View style={styles.buttonGroup}>
            <Pressable style={styles.actionBtn} onPress={handleSync}>
              <Text style={styles.actionBtnText}>手动同步</Text>
            </Pressable>
            <Pressable style={styles.actionBtnSecondary} onPress={handleFullSync}>
              <Text style={styles.actionBtnSecondaryText}>全量同步</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 操作 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>操作</Text>
        <View style={styles.card}>
          <Pressable style={styles.settingRow} onPress={handleClearCache}>
            <Text style={styles.dangerText}>清除本地缓存</Text>
          </Pressable>
          {isLoggedIn && (
            <Pressable style={[styles.settingRow, styles.lastRow]} onPress={handleLogout}>
              <Text style={styles.dangerText}>退出登录</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 关于 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <View style={styles.card}>
          <SettingRow label="版本" value="1.0.0" last />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>PromptTree - 让混乱归于秩序 🌳</Text>
      </View>
    </ScrollView>
  )
}

// ===================
// 辅助组件
// ===================

function SettingRow({
  label,
  value,
  last,
}: {
  label: string
  value: string
  last?: boolean
}) {
  return (
    <View style={[styles.settingRow, last && styles.lastRow]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  )
}

function syncStatusLabel(status: string): string {
  switch (status) {
    case 'syncing':
      return '同步中...'
    case 'success':
      return '已同步'
    case 'error':
      return '同步失败'
    default:
      return '空闲'
  }
}

// ===================
// 样式
// ===================

const styles = StyleSheet.create({
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
