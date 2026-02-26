import React, { useRef } from 'react'
import { View, Text, StyleSheet, Animated, I18nManager } from 'react-native'
import { Swipeable, RectButton } from 'react-native-gesture-handler'
import { colors, spacing } from '../utils/theme'

// ===================
// Props
// ===================

interface SwipeableRowProps {
  children: React.ReactNode
  /** 右滑动作（复制） */
  onSwipeLeft?: () => void
  /** 左滑动作（删除） */
  onSwipeRight?: () => void
}

// ===================
// 组件
// ===================

export default function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null)

  /** 右侧操作（左滑显示） - 删除 */
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!onSwipeRight) return null

    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    })

    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <RectButton
          style={styles.rightAction}
          onPress={() => {
            onSwipeRight()
            swipeableRef.current?.close()
          }}
        >
          <Text style={styles.actionText}>🗑️ 删除</Text>
        </RectButton>
      </Animated.View>
    )
  }

  /** 左侧操作（右滑显示） - 复制 */
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!onSwipeLeft) return null

    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, 0],
    })

    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <RectButton
          style={styles.leftAction}
          onPress={() => {
            onSwipeLeft()
            swipeableRef.current?.close()
          }}
        >
          <Text style={styles.actionText}>📋 复制</Text>
        </RectButton>
      </Animated.View>
    )
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      renderLeftActions={onSwipeLeft ? renderLeftActions : undefined}
      renderRightActions={onSwipeRight ? renderRightActions : undefined}
    >
      {children}
    </Swipeable>
  )
}

// ===================
// 样式
// ===================

const styles = StyleSheet.create({
  rightAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  leftAction: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
})
