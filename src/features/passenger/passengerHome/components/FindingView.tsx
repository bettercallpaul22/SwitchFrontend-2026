import React, { memo } from 'react';
import { StatusBar, View } from 'react-native';

import { AppButton } from '../../../../components/ui/AppButton';
import { AppText } from '../../../../components/ui/AppText';
import { BackButton } from './BackButton';
import { styles } from '../styles';
import { useAppSelector } from '../../../../store/hooks';

type FindingViewProps = {
  avatarLabel: string;
  topInset: number;
  bottomInset: number;
  onBackPress: () => void;
  onCancelRide: () => void;
  cancelLoading: boolean;
  visible?: boolean;
};

function FindingViewComponent({
  avatarLabel,
  topInset,
  bottomInset,
  onBackPress,
  onCancelRide,
  cancelLoading,
  visible = true,
}: FindingViewProps) {
  const rideData = useAppSelector((state) => state.ride);
  return (
    <View style={[styles.findingScreen, !visible ? styles.hiddenScreen : null]}>
      {visible ? (
        <StatusBar barStyle="light-content" backgroundColor="#003f41" />
      ) : null}

      <View style={[styles.findingTopBar, { paddingTop: topInset + 8 }]}>
        <BackButton onPress={onBackPress} />

        <View />
        <View />
      </View>

      <View
        style={[
          styles.findingContent,
          {
            paddingTop: topInset + 24,
            paddingBottom: bottomInset + 24,
          },
        ]}
      >
        <View style={styles.findingAvatarRing}>
          <View style={styles.findingAvatarCore}>
            <AppText variant="xl" style={styles.findingAvatarLabel}>
              {avatarLabel}
            </AppText>
          </View>
        </View>

        <View style={styles.findingProgressRow}>
          <View style={styles.findingProgressSegment} />
          <View style={styles.findingProgressSegment} />
          <View style={styles.findingProgressSegment} />
          <View style={styles.findingProgressSegment} />
        </View>

        <AppText variant="lg" style={styles.findingText}>
          Looking for pilots for you...
        </AppText>

        <View style={styles.findingPulseOuter}>
          <View style={styles.findingPulseInner}>
            <View style={styles.findingPulseCenter} />
          </View>
        </View>

        <AppButton
          title={cancelLoading ? 'Cancelling...' : 'Cancel Ride'}
          variant="danger"
          onPress={onCancelRide}
          loading={cancelLoading}
          style={styles.findingCancelButton}
        />
      </View>
    </View>
  );
}

export const FindingView = memo(FindingViewComponent);
