import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import type { LatLng, MapStyleElement, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

const DEFAULT_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01
};

const DEFAULT_EDGE_PADDING = {
  top: 80,
  right: 80,
  bottom: 80,
  left: 80
};

export type RideRequestRoute = {
  pickupLocation: LatLng;
  destinationLocation: LatLng;
};

export type DriverRideMapProps = {
  driverLocation: LatLng | null;
  rideRequest?: RideRequestRoute | null;
  pickupLocation?: LatLng | null;
  destinationLocation?: LatLng | null;
  googleMapsApiKey?: string;
  customMapStyle?: MapStyleElement[];
  style?: StyleProp<ViewStyle>;
  edgePadding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

const isValidCoordinate = (location: LatLng | null | undefined) =>
  Boolean(location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude));

const buildRegion = (location: LatLng): Region => ({
  latitude: location.latitude,
  longitude: location.longitude,
  latitudeDelta: DEFAULT_DELTA.latitudeDelta,
  longitudeDelta: DEFAULT_DELTA.longitudeDelta
});

export function DriverRideMap({
  driverLocation,
  rideRequest,
  pickupLocation,
  destinationLocation,
  googleMapsApiKey,
  customMapStyle,
  style,
  edgePadding = DEFAULT_EDGE_PADDING
}: DriverRideMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const hasCustomContainerStyle = Boolean(style);

  const resolvedPickupLocation = rideRequest?.pickupLocation ?? pickupLocation ?? null;
  const resolvedDestinationLocation = rideRequest?.destinationLocation ?? destinationLocation ?? null;

  const hasRideRequest =
    isValidCoordinate(resolvedPickupLocation) && isValidCoordinate(resolvedDestinationLocation);

  const mapRegion = useMemo(() => {
    if (!driverLocation) {
      return undefined;
    }

    return buildRegion(driverLocation);
  }, [driverLocation]);

  useEffect(() => {
    if (!isMapReady || !driverLocation || !mapRef.current) {
      return;
    }

    if (hasRideRequest && resolvedPickupLocation && resolvedDestinationLocation) {
      mapRef.current.fitToCoordinates(
        [driverLocation, resolvedPickupLocation, resolvedDestinationLocation],
        {
          edgePadding,
          animated: true
        }
      );
      return;
    }

    mapRef.current.animateToRegion(buildRegion(driverLocation), 500);
  }, [
    driverLocation,
    edgePadding,
    hasRideRequest,
    isMapReady,
    resolvedDestinationLocation,
    resolvedPickupLocation
  ]);
console.log("driver location", driverLocation);
  if (!driverLocation || !mapRegion) {
    return (
      <View style={hasCustomContainerStyle ? [styles.emptyStateFill, style] : styles.emptyState}>
        <Text style={styles.emptyTitle}>Waiting for driver location</Text>
        <Text style={styles.emptyDescription}>Pass a valid driver coordinate to render the map.</Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={hasCustomContainerStyle ? [styles.mapFill, style] : styles.map}
      initialRegion={mapRegion}
      customMapStyle={customMapStyle}
      onMapReady={() => setIsMapReady(true)}>
      <Marker coordinate={driverLocation} title="Driver" description="Current location">
        <View style={styles.driverMarker}>
          <Text style={styles.driverMarkerText}>CAR</Text>
        </View>
      </Marker>

      {hasRideRequest && resolvedPickupLocation && resolvedDestinationLocation ? (
        <>
          <Marker coordinate={resolvedPickupLocation} title="Pickup" pinColor="#f59e0b" />
          <Marker coordinate={resolvedDestinationLocation} title="Destination" pinColor="#2563eb" />

          {googleMapsApiKey ? (
            <>
              <MapViewDirections
                apikey={googleMapsApiKey}
                origin={driverLocation}
                destination={resolvedPickupLocation}
                strokeWidth={5}
                strokeColor="#16a34a"
              />
              <MapViewDirections
                apikey={googleMapsApiKey}
                origin={resolvedPickupLocation}
                destination={resolvedDestinationLocation}
                strokeWidth={5}
                strokeColor="#2563eb"
              />
            </>
          ) : (
            <>
              <Polyline
                coordinates={[driverLocation, resolvedPickupLocation]}
                strokeColor="#16a34a"
                strokeWidth={5}
              />
              <Polyline
                coordinates={[resolvedPickupLocation, resolvedDestinationLocation]}
                strokeColor="#2563eb"
                strokeWidth={5}
              />
            </>
          )}
        </>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 320,
    borderRadius: 16
  },
  mapFill: {
    flex: 1
  },
  emptyState: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  emptyStateFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700'
  },
  emptyDescription: {
    marginTop: 6,
    color: '#475569',
    fontSize: 13,
    textAlign: 'center'
  },
  driverMarker: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  driverMarkerText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  }
});
