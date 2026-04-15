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
  height?: number // ✅ OPTIONAL FIXED HEIGHT
  closeThresholdPercent?: number
  allowSheetDrag?: boolean
  maxHeightPercent?: number
}

export const BottomSheet1: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  height, // 👈 optional override
  closeThresholdPercent = 0.2,
  allowSheetDrag = true,
  maxHeightPercent = 0.9,
}) => {
  const [contentHeight, setContentHeight] = useState(0)

  const maxHeight = SCREEN_HEIGHT * maxHeightPercent

  // ✅ decide final height
  const sheetHeight = height
    ? Math.min(height, maxHeight)
    : Math.min(contentHeight, maxHeight)

  const translateY = useRef(new Animated.Value(maxHeight)).current
  const offsetY = useRef(0)

  // OPEN / CLOSE
  useEffect(() => {
    if (!sheetHeight) return

    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start()
      offsetY.current = 0
    } else {
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 250,
        useNativeDriver: true,
      }).start()
      offsetY.current = sheetHeight
    }
  }, [visible, sheetHeight])

  // PAN LOGIC
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        allowSheetDrag && Math.abs(g.dy) > 5,

      onPanResponderMove: (_, g) => {
        if (!allowSheetDrag) return

        let newY = offsetY.current + g.dy
        if (newY < 0) newY = 0

        translateY.setValue(newY)
      },

      onPanResponderRelease: (_, g) => {
        if (!allowSheetDrag) return

        let finalY = offsetY.current + g.dy
        if (finalY < 0) finalY = 0

        const threshold = sheetHeight * closeThresholdPercent
        const shouldClose =
          finalY > threshold || g.vy > 1.2

        if (shouldClose) {
          Animated.timing(translateY, {
            toValue: sheetHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(onClose)

          offsetY.current = sheetHeight
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start()

          offsetY.current = 0
        }
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
            height: sheetHeight, // ✅ NOW SUPPORTS BOTH MODES
            maxHeight,
            transform: [{ translateY }],
          },
        ]}
        {...(allowSheetDrag ? panResponder.panHandlers : {})}
      >
        {allowSheetDrag && <View style={styles.handle} />}

        {/* only measure if height not provided */}
        <View
          onLayout={(e) => {
            if (height) return // 👈 skip if fixed height
            const h = e.nativeEvent.layout.height
            if (h !== contentHeight) {
              setContentHeight(h)
            }
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