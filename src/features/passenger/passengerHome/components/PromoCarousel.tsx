import React, { memo, useState } from 'react';
import { Info, MapPin } from 'lucide-react-native';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';

import { AppText } from '../../../../components/ui/AppText';
import { styles } from '../styles';

const PROMO_SLIDES = [
  {
    id: 'welcome',
    title: 'WELCOME TO SWITCH',
    subtitle: 'A ride as unique as you...',
    action: 'Learn more',
    accent: '#28c796',
  },
  {
    id: 'coins',
    title: 'EARN SWITCHCOINS',
    subtitle: 'Get rewarded every time you move with us.',
    action: 'See rewards',
    accent: '#f7c94c',
  },
  {
    id: 'delivery',
    title: 'SEND IN MINUTES',
    subtitle: 'Book rides, pay, and deliver from one app.',
    action: 'Explore more',
    accent: '#54d9b2',
  },
] as const;

function PromoCarouselComponent() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const slideWidth = width - 16;

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const nextIndex = Math.round(contentOffset.x / layoutMeasurement.width);
    setActiveIndex(nextIndex);
  };

  return (
    <View style={styles.promoCarouselWrap}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.promoCarouselTrack}
      >
        {PROMO_SLIDES.map(slide => (
          <View key={slide.id} style={[styles.promoSlide, { width: slideWidth }]}>
            <View style={styles.welcomeBanner}>
              <View style={styles.welcomeBody}>
                <AppText variant="xl" style={styles.welcomeTitle}>
                  {slide.title}
                </AppText>
                <AppText variant="md" style={styles.welcomeSubtitle}>
                  {slide.subtitle}
                </AppText>
                <View style={styles.learnMoreRow}>
                  <Info color="#5f6a6a" size={12} />
                  <AppText variant="xs" style={styles.learnMoreText}>
                    {slide.action}
                  </AppText>
                </View>
              </View>

              <View style={styles.welcomeArt}>
                <View
                  style={[
                    styles.welcomeCarFrame,
                    { borderColor: slide.accent },
                  ]}
                >
                  <MapPin color={slide.accent} size={26} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bannerDots}>
        {PROMO_SLIDES.map((slide, index) => (
          <View
            key={slide.id}
            style={[
              styles.bannerDot,
              index === activeIndex ? styles.bannerDotActive : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export const PromoCarousel = memo(PromoCarouselComponent);
