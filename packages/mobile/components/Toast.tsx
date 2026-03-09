import React, { useEffect, useRef } from 'react'
import { Text, Animated, StyleSheet, Platform } from 'react-native'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  visible: boolean
  message: string
  type?: ToastType
  duration?: number
  onHide: () => void
}

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 2000,
  onHide,
}: ToastProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide())
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!visible) return null

  const bgColor =
    type === 'success'
      ? colors.success
      : type === 'error'
        ? colors.danger
        : colors.text

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: spacing.xl,
    right: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  text: {
    fontSize: fontSize.md,
    color: '#ffffff',
    fontWeight: '500',
  },
})
