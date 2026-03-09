import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme, useThemedStyles, type ThemeColors } from '../utils/theme'

interface LoadingOverlayProps {
  visible: boolean
}

export default function LoadingOverlay({ visible }: LoadingOverlayProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)

  if (!visible) return null

  return (
    <View style={styles.overlay}>
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
  },
  loader: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
})
