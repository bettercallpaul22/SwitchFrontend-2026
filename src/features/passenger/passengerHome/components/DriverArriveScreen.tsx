import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StatusBar,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import {
  BadgeCheck,
  Bell,
  CarFront,
  ChevronDown,
  Circle,
  MapPin,
  MessageCircleMore,
  Wallet2,
} from 'lucide-react-native';

import { AppText } from '../../../../components/ui/AppText';
import { DRIVER_MAP_STYLE } from '../../../driver/constants/mapStyle';
import { appColors } from '../../../../theme/colors';
import type { RideLocation, RideType } from '../../../../types/ride';
import { BackButton } from './BackButton';
import { styles } from '../styles';

type DriverArriveScreenProps = {
  visible?: boolean;
  topInset: number;
  bottomInset: number;
  mapRegion: Region;
  pickupLocation: RideLocation | null;
  stopLocation: RideLocation | null;
  destinationLocation: RideLocation | null;
  rideType: RideType;
  switchCoinBalance: number;
  paymentMethod: string;
  driverName: string;
  driverAvatarUrl?: string | null;
  driverRating?: number;
  completedTrips?: number;
  etaMinutes?: number;
  vehicleDescription?: string;
  vehiclePlate?: string;
  onBackPress: () => void;
  onCallDriver?: () => void;
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  onChangePaymentMethod?: () => void;
};

const COLLAPSED_SHEET_HEIGHT = 330;

function DriverArriveScreenComponent({
  visible = true,
  topInset,
  bottomInset,
  mapRegion,
  pickupLocation,
  stopLocation,
  destinationLocation,
  rideType,
  switchCoinBalance,
  paymentMethod,
  driverName,
  driverAvatarUrl,
  driverRating = 4.9,
  completedTrips = 1599,
  etaMinutes = 5,
  vehicleDescription = 'Honda Civic • Black',
  vehiclePlate = 'ABJ911NV',
  onBackPress,
  onCallDriver,
  onOpenChat,
  onOpenNotifications,
  onChangePaymentMethod,
}: DriverArriveScreenProps) {
  const { height } = useWindowDimensions();
  const maxSheetHeight = Math.min(height * 0.72, 560) + bottomInset;
  const [headerHeight, setHeaderHeight] = useState(0);
  const [bodyHeight, setBodyHeight] = useState(0);
  const sheetHeight = Math.min(headerHeight + bodyHeight, maxSheetHeight);
  const collapsedVisibleHeight = Math.min(
    Math.max(headerHeight + 220, COLLAPSED_SHEET_HEIGHT),
    sheetHeight || COLLAPSED_SHEET_HEIGHT,
  );
  const renderedSheetHeight = Math.max(sheetHeight, collapsedVisibleHeight);
  const collapsedOffset = Math.max(sheetHeight - collapsedVisibleHeight, 0);
  const translateY = useRef(new Animated.Value(collapsedOffset)).current;
  const dragOffset = useRef(collapsedOffset);

  useEffect(() => {
    translateY.stopAnimation((value) => {
      const nextValue =
        typeof value === 'number' ? Math.min(Math.max(value, 0), collapsedOffset) : collapsedOffset;
      translateY.setValue(nextValue);
      dragOffset.current = nextValue;
    });
  }, [collapsedOffset, translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            dragOffset.current = typeof value === 'number' ? value : collapsedOffset;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const next = Math.min(
            Math.max(dragOffset.current + gestureState.dy, 0),
            collapsedOffset,
          );
          translateY.setValue(next);
        },
        onPanResponderRelease: (_, gestureState) => {
          const current = dragOffset.current + gestureState.dy;
          const shouldExpand = gestureState.vy < -0.4 || current < collapsedOffset / 2;

          Animated.spring(translateY, {
            toValue: shouldExpand ? 0 : collapsedOffset,
            useNativeDriver: true,
            tension: 80,
            friction: 14,
          }).start(({ finished }) => {
            if (finished) {
              dragOffset.current = shouldExpand ? 0 : collapsedOffset;
            }
          });
        },
      }),
    [collapsedOffset, translateY],
  );

  const startAddress = pickupLocation?.address ?? 'Afri Hotel, CBD';
  const stopAddress = stopLocation?.address ?? 'Utako Modern Market, Utako';
  const destinationAddress = destinationLocation?.address ?? 'Alpha Estate, Wuye';
  const vehicleTitle = rideType === 'shared' ? 'Switch Cab Regular' : 'Switch Cab Medium';
  const paymentTitle = paymentMethod === 'cash' ? 'Cash Payment' : 'Switch Wallet';
  const coinCopy = `You have ${switchCoinBalance.toLocaleString()} Switch Coins`;
  const driverInitials = driverName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'DR';

  return (
    <View style={[styles.driverArriveScreen, !visible ? styles.hiddenScreen : null]}>
      {visible ? (
        <StatusBar barStyle="light-content" backgroundColor="#060708" />
      ) : null}

      <MapView
        style={styles.map}
        region={mapRegion}
        customMapStyle={DRIVER_MAP_STYLE}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        {pickupLocation ? (
          <Marker coordinate={pickupLocation.coordinates} title="Pickup" description={pickupLocation.address}>
            <View style={styles.driverArriveMarkerPickup}>
              <MapPin color="#ffffff" size={14} />
            </View>
          </Marker>
        ) : null}

        {stopLocation ? (
          <Marker coordinate={stopLocation.coordinates} title="Stop" description={stopLocation.address}>
            <View style={styles.driverArriveMarkerStop}>
              <Circle color="#ffffff" size={12} strokeWidth={3} />
            </View>
          </Marker>
        ) : null}

        {destinationLocation ? (
          <Marker
            coordinate={destinationLocation.coordinates}
            title="Destination"
            description={destinationLocation.address}
          >
            <View style={styles.driverArriveMarkerDestination} />
          </Marker>
        ) : null}
      </MapView>

      <View style={[styles.driverArriveTopOverlay, { paddingTop: topInset + 8 }]}>
        <View style={styles.driverArriveTopRow}>
          <BackButton onPress={onBackPress} />

          <View style={styles.driverArriveStatusPill}>
            <View style={styles.driverArriveStatusIcon}>
              <BadgeCheck color={appColors.primary} size={16} strokeWidth={2.5} />
            </View>
            <AppText variant="sm" style={styles.driverArriveStatusText}>
              Get ready, the driver will arrive soon
            </AppText>
          </View>

          <View style={styles.driverArriveMiniAvatar}>
            {driverAvatarUrl ? (
              <Image source={{ uri: driverAvatarUrl }} style={styles.driverArriveMiniAvatarImage} />
            ) : (
              <AppText variant="xs" style={styles.driverArriveMiniAvatarLabel}>
                {driverInitials}
              </AppText>
            )}
            <View style={styles.driverArriveMiniAvatarBadge} />
          </View>
        </View>
      </View>

      <View
        style={[
          styles.driverArriveDestinationWrap,
          { bottom: collapsedVisibleHeight + bottomInset + 18 },
        ]}
      >
        <View style={styles.driverArriveDestinationThumb}>
          <MapPin color="#f8fafc" size={14} />
        </View>
        <AppText variant="sm" style={styles.driverArriveDestinationText}>
          {destinationAddress}
        </AppText>
      </View>

      <Animated.View
        style={[
          styles.driverArriveSheetModal,
          {
            height: renderedSheetHeight,
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          {...panResponder.panHandlers}
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;

            if (Math.abs(nextHeight - headerHeight) > 1) {
              setHeaderHeight(nextHeight);
            }
          }}
        >
          <View style={styles.driverArriveEtaStrip}>
            <AppText variant="sm" style={styles.driverArriveEtaText}>
              {driverName.split(' ')[0]} will arrive in {etaMinutes} minutes
            </AppText>
          </View>

          <View style={styles.driverArriveHandle} />
        </View>

        <Animated.ScrollView
          bounces={sheetHeight >= maxSheetHeight}
          showsVerticalScrollIndicator={false}
          scrollEnabled={sheetHeight >= maxSheetHeight}
          contentContainerStyle={[
            styles.driverArriveSheetBodyContent,
            { paddingBottom: Math.max(48, bottomInset + 28) },
          ]}
        >
          <View
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;

              if (Math.abs(nextHeight - bodyHeight) > 1) {
                setBodyHeight(nextHeight);
              }
            }}
            style={styles.driverArrivePrimaryPanel}
          >
            <View style={styles.driverArriveVehicleCard}>
              <View style={styles.driverArriveVehicleBadge}>
                <CarFront color="#facc15" size={22} strokeWidth={2} />
                <View style={styles.driverArriveSeatBadge}>
                  <AppText variant="xs" style={styles.driverArriveSeatBadgeText}>
                    {rideType === 'shared' ? '4' : '2'}
                  </AppText>
                </View>
              </View>

              <View style={styles.driverArriveVehicleMeta}>
                <AppText variant="md" style={styles.driverArriveVehicleTitle}>
                  {vehicleTitle}
                </AppText>
                <AppText variant="xs" style={styles.driverArriveVehicleSubtitle}>
                  {vehicleDescription} · {vehiclePlate}
                </AppText>
              </View>

              <AppText variant="xl" style={styles.driverArriveVehiclePrice}>
                NGN 5,500
              </AppText>
            </View>

            <View style={styles.driverArriveDriverCard}>
              <View style={styles.driverArriveDriverMain}>
                <View style={styles.driverArriveDriverAvatar}>
                  {driverAvatarUrl ? (
                    <Image source={{ uri: driverAvatarUrl }} style={styles.driverArriveDriverAvatarImage} />
                  ) : (
                    <AppText variant="sm" style={styles.driverArriveDriverAvatarLabel}>
                      {driverInitials}
                    </AppText>
                  )}

                  <View style={styles.driverArriveRatingBadge}>
                    <AppText variant="xs" style={styles.driverArriveRatingText}>
                      {driverRating.toFixed(1)}
                    </AppText>
                  </View>
                </View>

                <View style={styles.driverArriveDriverMeta}>
                  <AppText variant="md" style={styles.driverArriveDriverName}>
                    {driverName}
                  </AppText>
                  <View style={styles.driverArriveDriverSubRow}>
                    <AppText variant="xs" style={styles.driverArriveDriverSubtext}>
                      Top Rated Driver
                    </AppText>
                    <AppText
                      variant="xs"
                      style={[
                        styles.driverArriveDriverSubtext,
                        { marginLeft: 8, color: '#fff', textDecorationLine: 'underline' },
                      ]}
                    >
                      {completedTrips} rides
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={styles.driverArriveActionRow}>
                <Pressable
                  onPress={onOpenChat}
                  style={({ pressed }) => [
                    styles.driverArriveActionButton,
                    pressed ? styles.pressed : undefined,
                  ]}
                >
                  <MessageCircleMore color="#f8fafc" size={17} />
                </Pressable>

                <Pressable
                  onPress={onOpenNotifications}
                  style={({ pressed }) => [
                    styles.driverArriveActionButton,
                    pressed ? styles.pressed : undefined,
                  ]}
                >
                  <Bell color="#f8fafc" size={17} />
                  <View style={styles.driverArriveAlertBadge}>
                    <AppText variant="xs" style={styles.driverArriveAlertBadgeText}>
                      2
                    </AppText>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.driverArriveRouteCard}>
              <View style={styles.driverArriveRouteRow}>
                <MapPin color="#cfe4df" size={14} />
                <View style={styles.driverArriveRouteCopy}>
                  <AppText variant="xs" style={styles.driverArriveRouteLabel}>
                    Start Location
                  </AppText>
                  <AppText variant="md" style={styles.driverArriveRouteValue}>
                    {startAddress}
                  </AppText>
                </View>
                <ChevronDown color="#8db6af" size={16} />
              </View>

              <View style={styles.driverArriveRouteDivider} />

              <View style={styles.driverArriveRouteRow}>
                <Circle color="#dbe9e6" size={12} strokeWidth={2.5} />
                <View style={styles.driverArriveRouteCopy}>
                  <AppText variant="md" style={styles.driverArriveRouteValue}>
                    {stopAddress}
                  </AppText>
                </View>
                <AppText variant="sm" style={styles.driverArriveRouteAction}>
                  ×
                </AppText>
                <View style={styles.driverArriveAddStop}>
                  <AppText variant="xs" style={styles.driverArriveAddStopText}>
                    +
                  </AppText>
                </View>
              </View>

              <View style={styles.driverArriveRouteDivider} />

              <View style={styles.driverArriveRouteRow}>
                <View style={styles.driverArriveDestinationDot} />
                <View style={styles.driverArriveRouteCopy}>
                  <AppText variant="xs" style={styles.driverArriveRouteLabel}>
                    Your Destination
                  </AppText>
                  <AppText variant="md" style={styles.driverArriveRouteValue}>
                    {destinationAddress}
                  </AppText>
                </View>
                <AppText variant="sm" style={styles.driverArriveRouteAction}>
                  ×
                </AppText>
              </View>
            </View>

            <View style={styles.driverArriveSectionHeader}>
              <AppText variant="lg" style={styles.driverArriveSectionTitle}>
                Payment Method
              </AppText>
            </View>

            <View style={styles.driverArrivePaymentCard}>
              <View style={styles.driverArrivePaymentBadge}>
                <Wallet2 color="#d8ece7" size={16} />
              </View>

              <View style={styles.driverArrivePaymentCopy}>
                <AppText variant="lg" style={styles.driverArrivePaymentTitle}>
                  {paymentTitle}
                </AppText>
                <AppText variant="sm" style={styles.driverArrivePaymentSubtitle}>
                  {coinCopy}
                </AppText>
              </View>

              <Pressable
                onPress={onChangePaymentMethod}
                style={({ pressed }) => [
                  styles.driverArrivePaymentAction,
                  pressed ? styles.pressed : undefined,
                ]}
              >
                <AppText variant="xs" style={styles.driverArrivePaymentActionText}>
                  Change
                </AppText>
              </Pressable>
            </View>
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
}

export const DriverArriveScreen = memo(DriverArriveScreenComponent);
