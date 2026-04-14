import React, { memo } from 'react';
import { Eye, MapPin } from 'lucide-react-native';
import { Pressable, ScrollView, StatusBar, View } from 'react-native';
import SwitchRide from '../../../../assets/images/icons/passenger_home/switch_ride.svg';
import SwitchDelivery from '../../../../assets/images/icons/passenger_home/switch_delivery.svg';
import SwitchPay from '../../../../assets/images/icons/passenger_home/scan_pay.svg';
import SwitchMart from '../../../../assets/images/icons/passenger_home/switch_mart.svg';
import SwitchFood from '../../../../assets/images/icons/passenger_home/scan_pay.svg';

import { AppText } from '../../../../components/ui/AppText';

import { MoreWaysCarousel } from './MoreWaysCarousel';
import { PromoCarousel } from './PromoCarousel';
import { styles } from '../styles';

type HomeViewProps = {
  avatarLabel: string;
  passengerName: string;
  walletBalance: string;
  switchCoinBalance: number;
  topInset: number;
  bottomInset: number;
  onRidePress: () => void;
  onShortcutPress: () => void;
  onAvatarPress: () => void;
  visible?: boolean;
};

function HomeViewComponent({
  avatarLabel,
  passengerName,
  walletBalance,
  switchCoinBalance,
  topInset,
  bottomInset,
  onRidePress,
  onShortcutPress,
  onAvatarPress,
  visible = true,
}: HomeViewProps) {
  return (
    <View style={[styles.homeScreen, !visible ? styles.hiddenScreen : null]}>
      {visible ? (
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
      ) : null}
      <ScrollView
        style={styles.homeScroll}
        contentContainerStyle={[
          styles.homeContent,
          { paddingTop: topInset + 10, paddingBottom: bottomInset + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.homeHeaderRow}>
          <View style={styles.homeHeaderLeft}>
            <Pressable onPress={onAvatarPress} style={({ pressed }) => [styles.homeAvatar, pressed ? styles.pressed : undefined]}>
              <AppText variant="sm" style={styles.homeAvatarText}>
                {avatarLabel}
              </AppText>
            </Pressable>
            <View>
              <AppText variant="lg" style={styles.homeGreeting}>
                Hi, {passengerName}
              </AppText>
            </View>
          </View>

          <View style={styles.homeLocationBadge}>
            <MapPin color="#f8fafc" size={16} />
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View style={[styles.balanceColumn, styles.balanceColumnLeft]}>
            <AppText variant="sm" style={styles.balanceLabel}>
              Wallet balance
            </AppText>

            <View style={styles.balanceWalletRow}>
              <AppText variant="xl" style={styles.balanceValue}>
                {walletBalance}
              </AppText>

              <Pressable
                onPress={() => undefined}
                style={({ pressed }) => [
                  styles.topUpChip,
                  pressed ? styles.pressed : undefined,
                ]}
              >
                <AppText variant="xs" style={styles.topUpChipText}>
                  Top up +
                </AppText>
              </Pressable>
            </View>
          </View>

          <View style={styles.balanceDivider} />

          <View style={[styles.balanceColumn, styles.balanceColumnRight]}>
            <AppText variant="sm" style={styles.balanceLabel}>
              SwitchCoin balance
            </AppText>

            <View style={styles.balanceCoinRow}>
              <View style={styles.coinBadge} />
              <AppText variant="xl" style={styles.balanceValue}>
                +{switchCoinBalance}{' '}
                <AppText variant="sm" style={styles.balanceCoinUnit}>
                  Coins
                </AppText>
              </AppText>
            </View>
          </View>

          <View style={styles.balanceEyeWrap}>
            <Eye color="#f3f4f6" size={18} strokeWidth={2} />
          </View>
        </View>

        <PromoCarousel />

        <View style={styles.servicesWrap}>
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 40,
            }}
          >
            <SwitchRide width={100} height={100}
            onPress={onRidePress}
            
            />
            <SwitchDelivery width={100} height={100} />
            {/* <SwitchRideIcon size={100}
            onPress={onRidePress}
            /> */}
            {/* <SwitchDeliveryIcon size={100} /> */}
          </View>

          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'center',
              paddingHorizontal: 40,
            }}
          >
            <SwitchPay width={120} height={100} />
          </View>
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 40,
            }}
          >
            <SwitchMart width={100} height={100} />
            <SwitchRide width={100} height={100} />
          </View>
        </View>

        <View style={styles.moreWaysSection}>
          <AppText variant="lg" style={styles.moreWaysTitle}>
            More ways to use Switch
          </AppText>
          <MoreWaysCarousel onShortcutPress={onShortcutPress} />
        </View>
      </ScrollView>
    </View>
  );
}

export const HomeView = memo(HomeViewComponent);
