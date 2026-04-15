import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  PanResponder,
  View,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { appColors } from '../../../../../theme/colors'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  height?: number
  closeThresholdPercent?: number
  allowSheetDrag?: boolean
  maxHeightPercent?: number
  snapPoints?: number[]
}

export const BottomSheet2: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  height,
  allowSheetDrag = true,
  maxHeightPercent = 0.9,
  snapPoints = [0],
}) => {
  const [contentHeight, setContentHeight] = useState(0)
  const maxHeight = SCREEN_HEIGHT * maxHeightPercent

  const sheetHeight = height
    ? Math.min(height, maxHeight)
    : Math.min(contentHeight, maxHeight)

  const translateY = useRef(new Animated.Value(sheetHeight || maxHeight)).current
  const offsetY = useRef(0)

  // ✅ Keep refs in sync so PanResponder closures always read fresh values
  const sheetHeightRef = useRef(sheetHeight)
  const snapPointsRef = useRef(snapPoints)

  useEffect(() => {
    sheetHeightRef.current = sheetHeight
  }, [sheetHeight])

  useEffect(() => {
    snapPointsRef.current = snapPoints
  }, [snapPoints])

  // Open / close animation
  useEffect(() => {
    if (!sheetHeight) return
    if (visible) {
      const initialSnap = snapPoints[0] ?? 0
      offsetY.current = initialSnap
      Animated.spring(translateY, {
        toValue: initialSnap,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 250,
        useNativeDriver: true,
      }).start()
      offsetY.current = sheetHeight
    }
  }, [visible, sheetHeight])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        allowSheetDrag && Math.abs(g.dy) > 5,

      onPanResponderMove: (_, g) => {
        if (!allowSheetDrag) return
        const sorted = [...snapPointsRef.current].sort((a, b) => a - b)
        const minY = sorted[0]
        const maxY = sorted[sorted.length - 1]
        const newY = Math.min(Math.max(offsetY.current + g.dy, minY), maxY)
        translateY.setValue(newY)
      },

      onPanResponderRelease: (_, g) => {
        if (!allowSheetDrag) return
        const currentY = offsetY.current + g.dy
        const sorted = [...snapPointsRef.current].sort((a, b) => a - b)

        let targetSnap: number

        if (g.vy > 0.5) {
          // Fast swipe down → next point below
          targetSnap = sorted.find((p) => p > currentY) ?? sorted[sorted.length - 1]
        } else if (g.vy < -0.5) {
          // Fast swipe up → next point above
          targetSnap = [...sorted].reverse().find((p) => p < currentY) ?? sorted[0]
        } else {
          // Slow drag → nearest point
          targetSnap = sorted.reduce((nearest, point) =>
            Math.abs(point - currentY) < Math.abs(nearest - currentY)
              ? point
              : nearest
          )
        }

        // ✅ Update offset BEFORE animating
        offsetY.current = targetSnap

        Animated.spring(translateY, {
          toValue: targetSnap,
          useNativeDriver: true,
          bounciness: 4,
        }).start()
      },
    })
  ).current

  if (!visible) return null

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight || maxHeight,
            maxHeight,
            transform: [{ translateY }],
          },
        ]}
        {...(allowSheetDrag ? panResponder.panHandlers : {})}
      >
        {allowSheetDrag && <View style={styles.handle} />}
        <View
          onLayout={(e) => {
            if (height) return
            const h = e.nativeEvent.layout.height
            if (h !== contentHeight) setContentHeight(h)
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: appColors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#777',
    alignSelf: 'center',
    marginBottom: 10,
  },
})