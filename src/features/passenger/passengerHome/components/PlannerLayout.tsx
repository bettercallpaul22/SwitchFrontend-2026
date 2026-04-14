import React from 'react';
import { StatusBar, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { AppText } from '../../../../components/ui/AppText';
import { DRIVER_MAP_STYLE } from '../../../driver/constants/mapStyle';
import type { RideLocation } from '../../../../types/ride';
import { BackButton } from './BackButton';
import { styles } from '../styles';

type PlannerLayoutProps = {
  title: string;
  avatarLabel: string;
  mapRegion: Region;
  pickupLocation: RideLocation | null;
  stopLocation: RideLocation | null;
  destinationLocation: RideLocation | null;
  topInset: number;
  bottomInset: number;
  isVehicleScreen: boolean;
  onBackPress: () => void;
  children: React.ReactNode;
};

export function PlannerLayout({
  title,
  avatarLabel,
  mapRegion,
  pickupLocation,
  stopLocation,
  destinationLocation,
  topInset,
  bottomInset,
  isVehicleScreen,
  onBackPress,
  children,
}: PlannerLayoutProps) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#05080d" />

      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        region={mapRegion}
        customMapStyle={DRIVER_MAP_STYLE}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        {pickupLocation ? (
          <Marker
            coordinate={pickupLocation.coordinates}
            title="Pickup"
            description={pickupLocation.address}
            pinColor="#22c55e"
          />
        ) : null}

        {stopLocation ? (
          <Marker
            coordinate={stopLocation.coordinates}
            title="Stop"
            description={stopLocation.address}
            pinColor="#38bdf8"
          />
        ) : null}

        {destinationLocation ? (
          <Marker
            coordinate={destinationLocation.coordinates}
            title="Destination"
            description={destinationLocation.address}
            pinColor="#f59e0b"
          />
        ) : null}
      </MapView>

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <BackButton onPress={onBackPress} />

        <View style={styles.planPill}>
          <AppText variant="label" style={styles.planPillText}>
            {title}
          </AppText>
        </View>

        <View style={styles.avatarWrap}>
          <AppText variant="xs" style={styles.avatarText}>
            {avatarLabel}
          </AppText>
          <View style={styles.avatarDot} />
        </View>
      </View>

      <View
        style={[
          styles.bottomSheet,
          isVehicleScreen ? styles.bottomSheetVehicle : undefined,
          { paddingBottom: Math.max(16, bottomInset + 8) },
        ]}
      >
        {children}
      </View>
    </View>
  );
}
