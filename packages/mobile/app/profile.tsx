import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native'
import { Stack } from 'expo-router'
import { useAuthStore } from '../stores/auth'
import { updateProfile } from '../api/auth'
import { createApiKey, listApiKeys, revokeApiKey, type ApiKeyInfo } from '../api/api-keys'
import { copyToClipboard } from '../utils/clipboard'
import { useI18n } from '../i18n'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

export default function ProfileScreen() {
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([])
  const [isLoadingKeys, setIsLoadingKeys] = useState(false)
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [apiKeyName, setApiKeyName] = useState('')

  useEffect(() => {
    setDisplayName(user?.displayName || '')
    setAvatarUrl(user?.avatarUrl || '')
  }, [user?.displayName, user?.avatarUrl])

  const loadApiKeyList = useCallback(async () => {
    setIsLoadingKeys(true)
    try {
      const response = await listApiKeys()
      setApiKeys(response.keys || [])
    } catch (error) {
      console.error('加载 API Key 失败:', error)
      Alert.alert(t('apiKeys.loadErrorTitle'), t('apiKeys.loadErrorMessage'))
    } finally {
      setIsLoadingKeys(false)
    }
  }, [t])

  useEffect(() => {
    void loadApiKeyList()
  }, [loadApiKeyList])

  const canSaveProfile = useMemo(() => {
    const nextName = displayName.trim()
    const nextAvatar = avatarUrl.trim()
    return nextName !== (user?.displayName || '') || nextAvatar !== (user?.avatarUrl || '')
  }, [avatarUrl, displayName, user?.avatarUrl, user?.displayName])

  const handleSaveProfile = useCallback(async () => {
    if (!canSaveProfile) return

    setIsSavingProfile(true)
    try {
      const response = await updateProfile({
        displayName: displayName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || null
      })

      setUser(response.user)
      Alert.alert(t('profile.saveSuccessTitle'), t('profile.saveSuccessMessage'))
    } catch (error) {
      console.error('更新资料失败:', error)
      Alert.alert(t('profile.saveErrorTitle'), t('profile.saveErrorMessage'))
    } finally {
      setIsSavingProfile(false)
    }
  }, [avatarUrl, canSaveProfile, displayName, setUser, t])

  const handleCreateApiKey = useCallback(async () => {
    if (isCreatingKey) return

    setIsCreatingKey(true)
    try {
      const response = await createApiKey({
        name: apiKeyName.trim() || undefined
      })

      setApiKeys(prev => [response.key, ...prev.filter(item => item.id !== response.key.id)])
      setApiKeyName('')

      Alert.alert(
        t('apiKeys.createSuccessTitle'),
        t('apiKeys.createSuccessMessage'),
        [
          {
            text: t('apiKeys.copyNow'),
            onPress: () => {
              void copyToClipboard(response.apiKey)
            }
          },
          { text: t('apiKeys.copyLater'), style: 'cancel' }
        ]
      )
    } catch (error) {
      console.error('创建 API Key 失败:', error)
      Alert.alert(t('apiKeys.createErrorTitle'), t('apiKeys.createErrorMessage'))
    } finally {
      setIsCreatingKey(false)
    }
  }, [apiKeyName, isCreatingKey, t])

  const handleRevokeApiKey = useCallback((id: string) => {
    Alert.alert(t('apiKeys.revokeTitle'), t('apiKeys.revokeMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('apiKeys.revoke'),
        style: 'destructive',
        onPress: async () => {
          try {
            await revokeApiKey(id)
            setApiKeys(prev => prev.filter(item => item.id !== id))
          } catch (error) {
            console.error('吊销 API Key 失败:', error)
            Alert.alert(t('apiKeys.revokeErrorTitle'), t('apiKeys.revokeErrorMessage'))
          }
        }
      }
    ])
  }, [t])

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: t('profile.title') }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.hintText}>{t('profile.loginRequired')}</Text>
        </View>
      </>
    )
  }

  return (
      <>
      <Stack.Screen options={{ title: t('profile.title') }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.accountInfo')}</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t('profile.displayName')}</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
              placeholder={t('profile.displayNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>{t('profile.avatarUrl')}</Text>
            <TextInput
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              style={styles.input}
              placeholder={t('profile.avatarUrlPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />

            <Pressable
              style={[styles.primaryBtn, (!canSaveProfile || isSavingProfile) && styles.disabledBtn]}
              onPress={handleSaveProfile}
              disabled={!canSaveProfile || isSavingProfile}
            >
              <Text style={styles.primaryBtnText}>
                {isSavingProfile ? t('profile.savingProfile') : t('profile.saveProfile')}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('apiKeys.title')}</Text>
          <View style={styles.card}>
            <TextInput
              value={apiKeyName}
              onChangeText={setApiKeyName}
              style={styles.input}
              placeholder={t('apiKeys.newKeyNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />

            <Pressable
              style={[styles.secondaryBtn, isCreatingKey && styles.disabledBtn]}
              onPress={handleCreateApiKey}
              disabled={isCreatingKey}
            >
              <Text style={styles.secondaryBtnText}>
                {isCreatingKey ? t('apiKeys.creating') : t('apiKeys.create')}
              </Text>
            </Pressable>

            <View style={styles.divider} />

            {isLoadingKeys ? (
              <Text style={styles.hintText}>{t('apiKeys.loading')}</Text>
            ) : apiKeys.length === 0 ? (
              <Text style={styles.hintText}>{t('apiKeys.empty')}</Text>
            ) : (
              apiKeys.map(item => (
                <View key={item.id} style={styles.keyRow}>
                  <View style={styles.keyInfo}>
                    <Text style={styles.keyName}>{item.name}</Text>
                    <Text style={styles.keyMeta}>{item.keyPrefix}</Text>
                  </View>
                  <Pressable onPress={() => handleRevokeApiKey(item.id)}>
                    <Text style={styles.revokeText}>{t('apiKeys.revoke')}</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
    padding: spacing.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  keyInfo: {
    flex: 1,
  },
  keyName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  keyMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  revokeText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: '600',
  },
})
