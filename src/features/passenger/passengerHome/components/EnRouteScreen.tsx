import React, { memo, useMemo } from 'react';
import { Image, Pressable, StatusBar, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import {
  CarFront,
  Circle,
  Eye,
  MapPin,
  MessageCircleMore,
  Route,
  SquarePen,
} from 'lucide-react-native';

import { AppText } from '../../../../components/ui/AppText';
import { appColors } from '../../../../theme/colors';
import type { RideLocation } from '../../../../types/ride';
import { DRIVER_MAP_STYLE } from '../../../driver/constants/mapStyle';
import { BackButton } from './BackButton';
import { styles } from '../styles';

type EnRouteScreenProps = {
  visible?: boolean;
  topInset: number;
  bottomInset: number;
  mapRegion: Region;
  pickupLocation: RideLocation | null;
  stopLocation: RideLocation | null;
  destinationLocation: RideLocation | null;
  passengerName: string;
  driverName: string;
  driverAvatarUrl?: string | null;
  tripDateLabel?: string;
  onBackPress: () => void;
  onCreateSchedule?: () => void;
  onEditSchedule?: () => void;
  onOpenTracking?: () => void;
  onOpenChat?: () => void;
};

function EnRouteScreenComponent({
  visible = true,
  topInset,
  bottomInset,
  mapRegion,
  pickupLocation,
  stopLocation,
  destinationLocation,
  passengerName,
  driverName,
  driverAvatarUrl,
  tripDateLabel = '12:55PM Friday May 23rd, 2025',
  onBackPress,
  onCreateSchedule,
  onEditSchedule,
  onOpenTracking,
  onOpenChat,
}: EnRouteScreenProps) {
  const routeStops = useMemo(
    () =>
      [pickupLocation?.address, stopLocation?.address, destinationLocation?.address].filter(
        (value): value is string => Boolean(value),
      ),
    [destinationLocation?.address, pickupLocation?.address, stopLocation?.address],
  );

  const driverInitials =
    driverName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'DR';

  const routeSummary = destinationLocation?.address ?? 'Alpha Estate, Wuye District';

  return (
    <View style={[styles.enRouteScreen, !visible ? styles.hiddenScreen : null]}>
      {visible ? <StatusBar barStyle="light-content" backgroundColor="#16181b" /> : null}

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
            <View style={styles.enRoutePickupMarker}>
              <MapPin color="#ffffff" size={14} />
            </View>
          </Marker>
        ) : null}

        {stopLocation ? (
          <Marker coordinate={stopLocation.coordinates} title="Stop" description={stopLocation.address}>
            <View style={styles.enRouteStopMarker}>
              <Circle color="#ffffff" size={12} strokeWidth={2.8} />
            </View>
          </Marker>
        ) : null}

        {destinationLocation ? (
          <Marker
            coordinate={destinationLocation.coordinates}
            title="Destination"
            description={destinationLocation.address}
          >
            <View style={styles.enRouteCarMarker}>
              <CarFront color="#031b19" size={18} strokeWidth={2.2} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <View style={[styles.enRouteTopOverlay, { paddingTop: topInset + 8 }]}>
        <BackButton onPress={onBackPress} />
        <AppText variant="xl" style={styles.enRouteTitle}>
          Schedule
        </AppText>
      </View>

      <View style={[styles.enRouteRoutePill, { bottom: 222 + bottomInset }]}>
        <View style={styles.enRouteRouteThumb} />
        <AppText numberOfLines={1} variant="sm" style={styles.enRouteRouteText}>
          {routeSummary}
        </AppText>
      </View>

      <View style={[styles.enRouteBottomSheet, { paddingBottom: Math.max(18, bottomInset + 6) }]}>
        <View style={styles.enRouteDriverRow}>
          <View style={styles.enRouteDriverIdentity}>
            <View style={styles.enRouteAvatarWrap}>
              {driverAvatarUrl ? (
                <Image source={{ uri: driverAvatarUrl }} style={styles.enRouteAvatarImage} />
              ) : (
                <AppText variant="sm" style={styles.enRouteAvatarLabel}>
                  {driverInitials}
                </AppText>
              )}
            </View>

            <View style={styles.enRouteDriverCopy}>
              <View style={styles.enRouteNameRow}>
                <AppText variant="xl" style={styles.enRouteDriverName}>
                  {driverName.split(' ')[0]}
                </AppText>
                <AppText variant="sm" style={styles.enRoutePassengerHandle}>
                  {passengerName}
                </AppText>
              </View>

              <AppText variant="sm" style={styles.enRouteTripTime}>
                {tripDateLabel}
              </AppText>
            </View>
          </View>

          <View style={styles.enRouteActionCluster}>
            <Pressable
              onPress={onOpenChat}
              style={({ pressed }) => [
                styles.enRouteActionButton,
                pressed ? styles.pressed : undefined,
              ]}
            >
              <MessageCircleMore color="#e7f2ef" size={15} />
            </Pressable>

            <Pressable
              onPress={onOpenTracking}
              style={({ pressed }) => [
                styles.enRouteActionButton,
                pressed ? styles.pressed : undefined,
              ]}
            >
              <Eye color="#e7f2ef" size={15} />
            </Pressable>
          </View>
        </View>

        <View style={styles.enRouteSection}>
          <AppText variant="label" style={styles.enRouteSectionTitle}>
            Trip Route
          </AppText>

          <View style={styles.enRouteRouteList}>
            {routeStops.map((stop, index) => (
              <View key={`${stop}-${index}`} style={styles.enRouteRouteItem}>
                <Route color={index === routeStops.length - 1 ? '#5eead4' : '#c6dbd8'} size={13} />
                <AppText variant="sm" style={styles.enRouteRouteItemText}>
                  {stop}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.enRouteFooterActions}>
          <Pressable
            onPress={onCreateSchedule}
            style={({ pressed }) => [
              styles.enRouteFooterButton,
              pressed ? styles.pressed : undefined,
            ]}
          >
            <SquarePen color="#d7ebe8" size={15} />
            <AppText variant="sm" style={styles.enRouteFooterButtonText}>
              Create new schedule
            </AppText>
          </Pressable>

          <Pressable
            onPress={onEditSchedule}
            style={({ pressed }) => [
              styles.enRouteFooterButton,
              styles.enRouteFooterButtonSecondary,
              pressed ? styles.pressed : undefined,
            ]}
          >
            <SquarePen color="#d7ebe8" size={15} />
            <AppText variant="sm" style={styles.enRouteFooterButtonText}>
              Edit this schedule
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export const EnRouteScreen = memo(EnRouteScreenComponent);
