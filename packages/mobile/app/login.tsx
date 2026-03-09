import React, { useState, useCallback, useEffect } from 'react'
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
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuthStore } from '../stores/auth'
import {
  sendMagicLink,
  loginWithPassword,
  register,
  resendVerification,
} from '../api/auth'
import { getApiBaseUrl } from '../api/config'
import { useI18n } from '../i18n'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

type AuthMode = 'login' | 'register'

function getApiErrorText(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  try {
    const parsed = JSON.parse(raw) as { error?: string; code?: string }
    return parsed.error || parsed.code || raw
  } catch (parseError) {
    console.warn('解析 API 错误响应失败，回退原始错误文本:', parseError)
    return raw
  }
}

function getAuthCallbackErrorText(
  code: string,
  t: (key: string) => string
): string {
  const errorMap: Record<string, string> = {
    no_code: t('login.callbackErrors.no_code'),
    not_configured: t('login.callbackErrors.not_configured'),
    token_failed: t('login.callbackErrors.token_failed'),
    callback_failed: t('login.callbackErrors.callback_failed'),
    no_token: t('login.callbackErrors.no_token'),
    invalid_or_expired_token: t('login.callbackErrors.invalid_or_expired_token'),
    link_already_used: t('login.callbackErrors.link_already_used'),
    user_not_found: t('login.callbackErrors.user_not_found')
  }

  return errorMap[code] || t('login.callbackErrors.default')
}

export default function LoginScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const params = useLocalSearchParams<{ error?: string }>()
  const handleToken = useAuthStore(s => s.handleToken)
  const setAuth = useAuthStore(s => s.setAuth)
  const enterOfflineMode = useAuthStore(s => s.enterOfflineMode)

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)

  useEffect(() => {
    const callbackError = typeof params.error === 'string' ? params.error : null
    if (!callbackError) return

    setErrorText(getAuthCallbackErrorText(callbackError, t))
    setRegistrationSuccess(false)
    setEmailNotVerified(false)
    setMagicLinkSent(false)
  }, [params.error, t])

  const switchMode = useCallback((nextMode: AuthMode) => {
    setMode(nextMode)
    setErrorText('')
    setRegistrationSuccess(false)
    setEmailNotVerified(false)
    setMagicLinkSent(false)
  }, [])

  const handlePasswordLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      setErrorText(t('login.emailAndPasswordRequired'))
      return
    }

    setIsLoading(true)
    setErrorText('')
    setEmailNotVerified(false)

    try {
      const result = await loginWithPassword(email.trim(), password)
      setAuth(result.accessToken, result.user)
      router.replace('/(tabs)')
    } catch (error) {
      const code = getApiErrorText(error)
      if (code.includes('EMAIL_NOT_VERIFIED')) {
        setEmailNotVerified(true)
      } else if (code.includes('INVALID_CREDENTIALS')) {
        setErrorText(t('login.invalidCredentials'))
      } else {
        setErrorText(t('login.loginError'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [email, password, router, setAuth, t])

  const handleRegister = useCallback(async () => {
    if (!email.trim() || !password) {
      setErrorText(t('login.emailAndPasswordRequired'))
      return
    }

    if (password.length < 6) {
      setErrorText(t('login.passwordTooShort'))
      return
    }

    setIsLoading(true)
    setErrorText('')
    setRegistrationSuccess(false)

    try {
      await register(email.trim(), password, displayName.trim() || undefined, { mobile: true })
      setRegistrationSuccess(true)
    } catch (error) {
      const code = getApiErrorText(error)
      if (code.includes('EMAIL_EXISTS')) {
        setErrorText(t('login.emailExists'))
      } else {
        setErrorText(t('login.registerError'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [displayName, email, password, t])

  const handleResendVerification = useCallback(async () => {
    if (!email.trim()) return

    setIsLoading(true)
    setErrorText('')

    try {
      await resendVerification(email.trim(), { mobile: true })
      setRegistrationSuccess(true)
      setEmailNotVerified(false)
    } catch (error) {
      const code = getApiErrorText(error)
      if (code.includes('RATE_LIMIT')) {
        setErrorText(t('login.rateLimited'))
      } else if (code.includes('EMAIL_ALREADY_VERIFIED')) {
        setErrorText(t('login.emailAlreadyVerified'))
      } else {
        setErrorText(t('login.sendError'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [email, t])

  const handleMagicLink = useCallback(async () => {
    if (!email.trim()) {
      setErrorText(t('login.emailRequired'))
      return
    }

    setIsLoading(true)
    setErrorText('')

    try {
      const result = await sendMagicLink(email.trim(), { mobile: true })
      setMagicLinkSent(true)

      if (result._dev?.verifyUrl) {
        const verifyRes = await fetch(result._dev.verifyUrl)
        const redirectUrl = verifyRes.url
        const match = redirectUrl.match(/[?&]token=([^&]+)/)
        if (match) {
          const success = await handleToken(match[1])
          if (success) {
            router.replace('/(tabs)')
            return
          }
        }
      }
    } catch (error) {
      setErrorText(t('login.sendError'))
    } finally {
      setIsLoading(false)
    }
  }, [email, handleToken, router, t])

  const handleGitHub = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = `${getApiBaseUrl()}/api/auth/github?mobile=1`
      await Linking.openURL(url)
    } catch (error) {
      console.error('打开 GitHub 登录失败:', error)
      Alert.alert(t('login.githubOpenErrorTitle'), t('login.githubOpenErrorMessage'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  const handleSkip = useCallback(() => {
    enterOfflineMode()
    router.replace('/(tabs)')
  }, [enterOfflineMode, router])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <Text style={styles.logo}>🌳</Text>
          <Text style={styles.appName}>PromptTree</Text>
          <Text style={styles.tagline}>{t('login.appTagline')}</Text>
        </View>

        <View style={styles.modeSwitch}>
          <Pressable
            style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
            onPress={() => switchMode('login')}
          >
            <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>{t('login.login')}</Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
            onPress={() => switchMode('register')}
          >
            <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>{t('login.register')}</Text>
          </Pressable>
        </View>

        {errorText ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : null}

        {emailNotVerified ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{t('login.emailNotVerifiedHint')}</Text>
            <Pressable onPress={handleResendVerification} disabled={isLoading}>
              <Text style={styles.warningAction}>{t('login.resendVerification')}</Text>
            </Pressable>
          </View>
        ) : null}

        {registrationSuccess ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>{t('login.verificationSentTitle')}</Text>
            <Text style={styles.successText}>{t('login.verificationSentHint')}</Text>
            <Pressable onPress={() => switchMode('login')}>
              <Text style={styles.successAction}>{t('login.backToLogin')}</Text>
            </Pressable>
          </View>
        ) : magicLinkSent ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>{t('login.magicLinkSentTitle')}</Text>
            <Text style={styles.successText}>{t('login.magicLinkSentHint', { email })}</Text>
          </View>
        ) : (
          <View style={styles.formSection}>
            {mode === 'register' && (
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('login.displayNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                editable={!isLoading}
              />
            )}

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword(v => !v)}
              >
                <Text style={styles.passwordToggleText}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
              onPress={mode === 'login' ? handlePasswordLogin : handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'login' ? t('login.loginWithEmail') : t('login.createAccount')}
                </Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('login.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={styles.oauthBtn}
              onPress={handleGitHub}
              disabled={isLoading}
            >
              <Text style={styles.oauthBtnText}>{t('login.loginWithGithub')}</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              onPress={handleMagicLink}
              disabled={isLoading}
            >
              <Text style={styles.secondaryBtnText}>{t('login.sendMagicLink')}</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('login.skipLogin')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    marginBottom: spacing.xl,
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
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 4,
    marginBottom: spacing.md,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modeTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  warningBox: {
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
  warningAction: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  successBox: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.successBg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successAction: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  input: {
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
  },
  passwordToggle: {
    marginLeft: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  passwordToggleText: {
    fontSize: 18,
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
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
  secondaryBtnText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
