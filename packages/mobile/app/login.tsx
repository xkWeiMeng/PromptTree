import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../stores/auth'
import { apiRequest, getApiBaseUrl } from '../api/client'
import { colors, spacing, fontSize } from '../utils/theme'

export default function LoginScreen() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const setUser = useAuthStore(s => s.setUser)

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // ===================
  // 邮箱魔法链接
  // ===================
  const handleMagicLink = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱地址')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiRequest<any>('POST', '/api/auth/magic-link', { email: email.trim() })

      if (res.success) {
        setMagicLinkSent(true)

        // 开发环境：自动使用返回的 token 登录
        if (res._dev?.verifyUrl) {
          const verifyRes = await fetch(res._dev.verifyUrl)
          const redirectUrl = verifyRes.url
          const match = redirectUrl.match(/[?&]token=([^&]+)/)
          if (match) {
            await login(match[1])
            // 获取用户信息
            const meRes = await apiRequest<any>('GET', '/api/auth/me')
            if (meRes.success && meRes.user) {
              setUser(meRes.user)
            }
            router.replace('/(tabs)')
            return
          }
        }

        Alert.alert('已发送', '请检查邮箱中的登录链接')
      } else {
        Alert.alert('失败', res.error || '发送失败')
      }
    } catch (err) {
      Alert.alert('错误', '网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [email, login, setUser, router])

  // ===================
  // GitHub OAuth（浏览器跳转）
  // ===================
  const handleGitHub = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = `${getApiBaseUrl()}/api/auth/github`
      await Linking.openURL(url)
    } catch (err) {
      Alert.alert('错误', '无法打开 GitHub 登录')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ===================
  // 跳过登录（离线模式）
  // ===================
  const handleSkip = useCallback(() => {
    router.replace('/(tabs)')
  }, [router])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>🌳</Text>
          <Text style={styles.appName}>PromptTree</Text>
          <Text style={styles.tagline}>让混乱归于秩序</Text>
        </View>

        {/* 邮箱登录 */}
        <View style={styles.formSection}>
          {magicLinkSent ? (
            <View style={styles.sentBox}>
              <Text style={styles.sentIcon}>✉️</Text>
              <Text style={styles.sentTitle}>登录链接已发送</Text>
              <Text style={styles.sentText}>
                请查看 {email} 的收件箱，点击链接完成登录
              </Text>
              <Pressable onPress={() => setMagicLinkSent(false)}>
                <Text style={styles.retryLink}>使用其他邮箱</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>邮箱登录</Text>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Pressable
                style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
                onPress={handleMagicLink}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>发送登录链接</Text>
                )}
              </Pressable>
            </>
          )}
        </View>

        {/* 分割线 */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>或</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* OAuth */}
        <View style={styles.oauthSection}>
          <Pressable
            style={styles.oauthBtn}
            onPress={handleGitHub}
            disabled={isLoading}
          >
            <Text style={styles.oauthBtnText}>🐙 使用 GitHub 登录</Text>
          </Pressable>
        </View>

        {/* 跳过 */}
        <Pressable style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>跳过登录，先看看</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  emailInput: {
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  disabledBtn: {
    opacity: 0.6,
  },
  sentBox: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  sentIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  sentTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sentText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  retryLink: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  oauthSection: {
    marginBottom: spacing.xl,
  },
  oauthBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  oauthBtnText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
})
