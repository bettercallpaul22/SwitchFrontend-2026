import React from 'react';
import { Pressable, View } from 'react-native';

import { PlacesSearchInput } from '../../../../components/places';
import { AppButton } from '../../../../components/ui/AppButton';
import { AppText } from '../../../../components/ui/AppText';
import { GOOGLE_MAPS_DIRECTIONS_API_KEY } from '../../../../config/api';
import type { RideLocation } from '../../../../types/ride';
import { DESTINATION_PLACES } from '../constants';
import { styles } from '../styles';

type RouteViewProps = {
  pickupAddress: string;
  destinationInputValue: string;
  error: string | null;
  canContinueToVehicle: boolean;
  onDestinationInputChange: (value: string) => void;
  onSelectDestination: (location: RideLocation) => void;
  onContinue: () => void;
};

export function RouteView({
  pickupAddress,
  destinationInputValue,
  error,
  canContinueToVehicle,
  onDestinationInputChange,
  onSelectDestination,
  onContinue,
}: RouteViewProps) {
  return (
    <>
      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <AppText variant="xs" style={styles.routeLabel}>
            Start location
          </AppText>
          <AppText variant="label" style={styles.routeValue}>
            {pickupAddress}
          </AppText>
        </View>

        <View style={styles.routeDivider} />

        <View style={styles.routeRow}>
          <AppText variant="xs" style={styles.routeLabel}>
            Your destination
          </AppText>
          <AppText variant="label" style={styles.routeValue}>
            {destinationInputValue || 'Choose a destination below'}
          </AppText>
        </View>
      </View>

      <PlacesSearchInput
        apiKey={GOOGLE_MAPS_DIRECTIONS_API_KEY}
        value={destinationInputValue}
        onChangeText={onDestinationInputChange}
        onPlaceSelected={onSelectDestination}
        placeholder="Your destination"
        variant="dark"
        errorText={error}
        disabled
      />

      <View style={styles.quickPlaceList}>
        {DESTINATION_PLACES.map(place => {
          const Icon = place.icon;

          return (
            <Pressable
              key={place.id}
              onPress={() => onSelectDestination(place.location)}
              style={({ pressed }) => [
                styles.quickPlaceItem,
                pressed ? styles.pressed : undefined,
              ]}
            >
              <View style={styles.quickPlaceIconWrap}>
                <Icon color="#dbeafe" size={14} />
              </View>
              <View style={styles.quickPlaceTextWrap}>
                <AppText variant="label" style={styles.quickPlaceTitle}>
                  {place.title}
                </AppText>
                <AppText variant="sm" style={styles.quickPlaceSubtitle}>
                  {place.subtitle}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <AppButton
        title="Continue"
        variant="secondary"
        onPress={onContinue}
        disabled={!canContinueToVehicle}
      />
    </>
  );
}
