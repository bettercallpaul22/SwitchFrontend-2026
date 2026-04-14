import React, { memo, useRef } from 'react';
import { ArrowRight } from 'lucide-react-native';
import {
  Animated,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import SwitchDelivery from '../../../../assets/images/icons/passenger_home/switch_delivery.svg';
import SwitchMart from '../../../../assets/images/icons/passenger_home/switch_mart.svg';
import ScanPay from '../../../../assets/images/icons/passenger_home/scan_pay.svg';
import SwitchRide from '../../../../assets/images/icons/passenger_home/switch_ride.svg';

import { AppText } from '../../../../components/ui/AppText';
import { styles } from '../styles';

type MoreWaysCarouselProps = {
  onShortcutPress: () => void;
};

type ShortcutId = 'deliveries' | 'scan' | 'ride' | 'mart';

const HOME_SHORTCUTS: Array<{
  id: ShortcutId;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'deliveries',
    title: 'Make deliveries',
    subtitle: 'Same-day delivery anywhere in town',
  },
  {
    id: 'scan',
    title: 'Pay with Switch',
    subtitle: 'Scan, Pay, & Go.',
  },
  {
    id: 'ride',
    title: 'Book a ride',
    subtitle: 'Quick pickups for every trip in town',
  },
  {
    id: 'mart',
    title: 'Shop SwitchMart',
    subtitle: 'Get groceries and essentials fast',
  },
];

function renderShortcutIcon(id: ShortcutId) {
  if (id === 'deliveries') {
    return <SwitchDelivery width={64} height={64} />;
  }

  if (id === 'scan') {
    return <ScanPay width={58} height={58} />;
  }

  if (id === 'ride') {
    return <SwitchRide width={64} height={64} />;
  }

  return <SwitchMart width={64} height={64} />;
}

function MoreWaysCarouselComponent({ onShortcutPress }: MoreWaysCarouselProps) {
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const cardWidth = Math.min(width - 110, 228);
  const snapInterval = cardWidth + 10;

  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      decelerationRate="fast"
      snapToInterval={snapInterval}
      snapToAlignment="start"
      disableIntervalMomentum
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
      contentContainerStyle={styles.shortcutRow}
    >
      {HOME_SHORTCUTS.map((shortcut, index) => {
        const inputRange = [
          (index - 1) * snapInterval,
          index * snapInterval,
          (index + 1) * snapInterval,
        ];
        const scale = scrollX.interpolate({
          inputRange,
          outputRange: [0.94, 1, 0.94],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.72, 1, 0.72],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={shortcut.id}
            style={[
              styles.shortcutCardWrap,
              {
                width: cardWidth,
                opacity,
                transform: [{ scale }],
              },
            ]}
          >
            <Pressable
              onPress={onShortcutPress}
              style={({ pressed }) => [
                styles.shortcutCard,
                pressed ? styles.pressed : undefined,
              ]}
            >
              <View style={styles.shortcutMediaFrame}>
                <View style={styles.shortcutMediaInner}>
                  {renderShortcutIcon(shortcut.id)}
                </View>
              </View>

              <View style={styles.shortcutCopyBlock}>
                <View style={styles.shortcutHeadingRow}>
                  <AppText variant="xl" style={styles.shortcutTitle}>
                    {shortcut.title}
                  </AppText>
                  <View style={styles.shortcutArrowWrap}>
                    <ArrowRight color="#f8fafc" size={18} strokeWidth={3} />
                  </View>
                </View>

                <AppText variant="md" style={styles.shortcutSubtitle}>
                  {shortcut.subtitle}
                </AppText>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </Animated.ScrollView>
  );
}

export const MoreWaysCarousel = memo(MoreWaysCarouselComponent);
