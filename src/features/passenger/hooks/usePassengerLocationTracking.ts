import { useCallback, useEffect, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import type {
  GeolocationError,
  GeolocationResponse
} from '@react-native-community/geolocation';

import {
  PassengerLiveLocation,
  setPassengerLocation,
  setTracking,
  setPassengerOnlineStatus,
  setWaitingForRide
} from '../../../store/passengerLocationSlice';
import { logout, updatePassengerSessionLocation } from '../../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setPassengerOfflineState,
  syncPassengerLiveLocation,
  syncPassengerPresence
} from '../../../services/passengerLocationService';
import {
  LOCATION_DISTANCE_THRESHOLD_IN_METERS,
  GEOLOCATION_WATCHER_CONFIG,
  GEOLOCATION_GET_POSITION_CONFIG,
  calculateDistanceInMeters
} from '../../../utils/locationTracking';
import { encodeGeohash } from '../../../utils/geohash';

/**
 * Builds passenger live location from geolocation response
 * Similar to buildDriverLiveLocation but for passengers
 */
const buildPassengerLiveLocation = (position: GeolocationResponse): PassengerLiveLocation => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  heading: position.coords.heading ?? null,
  speed: position.coords.speed ?? null,
  accuracy: position.coords.accuracy ?? null,
  geohash: encodeGeohash(
    position.coords.latitude,
    position.coords.longitude
  ),
  updatedAt: new Date().toISOString()
});

export function usePassengerLocationTracking() {
  const dispatch = useAppDispatch();
  const { session } = useAppSelector((state) => state.auth);
  const { currentLocation, isOnline, isTracking, isWaitingForRide } = useAppSelector(
    (state) => state.passengerLocation || { currentLocation: null, isOnline: true, isTracking: false, isWaitingForRide: false, lastLocationUpdate: null }
  );

  const watchIdRef = useRef<number | null>(null);
  const lastProcessedLocationRef = useRef<PassengerLiveLocation | null>(null);
  const lastSyncedLocationRef = useRef<PassengerLiveLocation | null>(null);
  const syncLocationRef = useRef<(location: PassengerLiveLocation) => Promise<void>>(async () => {});
  const watchStartedRef = useRef(false);

  /**
   * Toggle passenger online status
   * Syncs to Firestore and updates Redux state
   */
  const onToggleOnline = useCallback(async () => {
    if (!session || session.user.role !== 'passenger') return;

    const next = !isOnline;

    try {
      await syncPassengerPresence({
        passengerId: session.user.id,
        isOnline: next,
        isWaitingForRide: next ? isWaitingForRide : false,
        activeRideId: session.user.activeRideId ?? null,
        updatedAt: new Date().toISOString(),
        location: currentLocation ?? undefined
      });

      dispatch(setPassengerOnlineStatus(next));
    } catch (error) {
      console.error('Error toggling passenger online:', error);
    }
  }, [currentLocation, dispatch, isOnline, isWaitingForRide, session]);

  /**
   * Logout and cleanup location tracking
   */
  const onLogout = useCallback(() => {
    if (session?.user.role === 'passenger' && currentLocation) {
      void setPassengerOfflineState(session.user.id).catch(() => undefined);
    }
    dispatch(logout());
  }, [dispatch, session, currentLocation]);

  // Seed Redux with last known location from session on mount
  useEffect(() => {
    if (!session || session.user.role !== 'passenger') return;

    if (!currentLocation && session.user.lastKnownLocation) {
      const location: PassengerLiveLocation = {
        latitude: session.user.lastKnownLocation.lat,
        longitude: session.user.lastKnownLocation.lng,
        heading: null,
        speed: null,
        accuracy: null,
        geohash: encodeGeohash(
          session.user.lastKnownLocation.lat,
          session.user.lastKnownLocation.lng
        ),
        updatedAt: session.user.lastLocationUpdatedAt ?? session.user.updatedAt
      };

      dispatch(setPassengerLocation(location));
      lastProcessedLocationRef.current = location;
      lastSyncedLocationRef.current = location;
    }
  }, [currentLocation, dispatch, session]);

  // Effect 1: Keep syncLocationRef current without restarting the watcher
  useEffect(() => {
    syncLocationRef.current = async (location: PassengerLiveLocation) => {
      const previousLocation = lastSyncedLocationRef.current;
      const movedEnough = previousLocation
        ? calculateDistanceInMeters(previousLocation, location) >= LOCATION_DISTANCE_THRESHOLD_IN_METERS
        : true;

      if (!movedEnough) return;

      lastSyncedLocationRef.current = location;

      // Convert PassengerLiveLocation back to GeolocationResponse format
      const geolocationResponse: GeolocationResponse = {
        coords: {
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading ?? 0,
          speed: location.speed ?? 0,
          accuracy: location.accuracy ?? 0,
          altitude: 0,
          altitudeAccuracy: 0
        },
        timestamp: new Date(location.updatedAt).getTime()
      };

      await syncPassengerLiveLocation(
        session!.user.id,
        geolocationResponse,
        location.geohash
      );
    };
  }, [dispatch, session]);

  // Effect 2: Start the geolocation watcher ONCE on mount
  useEffect(() => {
    if (!session || session.user.role !== 'passenger') return;
    if (watchStartedRef.current) return;

    watchStartedRef.current = true;

    const handlePositionSuccess = (position: GeolocationResponse) => {
      const newLocation = buildPassengerLiveLocation(position);

      // MANUAL DISTANCE CHECK - Workaround for unreliable distanceFilter on Android
      const lastLocation = lastProcessedLocationRef.current;
      const distanceMoved = lastLocation
        ? calculateDistanceInMeters(lastLocation, newLocation)
        : Infinity;

      // Only process if moved enough or it's the first location
      if (distanceMoved >= LOCATION_DISTANCE_THRESHOLD_IN_METERS || !lastLocation) {
        // Update the last processed location
        lastProcessedLocationRef.current = newLocation;

        // Update Redux with the new location
        dispatch(setPassengerLocation(newLocation));
        dispatch(
          updatePassengerSessionLocation({
            lat: newLocation.latitude,
            lng: newLocation.longitude,
            updatedAt: newLocation.updatedAt
          })
        );

        dispatch(setTracking(true));

        // Only sync to Firestore when online
        if (isOnlineRef.current) {
          void syncLocationRef.current(newLocation).catch((error) => {
            console.error('Error syncing passenger location:', error);
          });
        }

        // Log only when actually updated (for debugging)
        if (__DEV__ && distanceMoved > 0) {
          console.log(`Passenger location updated - moved ${distanceMoved.toFixed(2)} meters`);
        }
      } else if (__DEV__ && distanceMoved > 0) {
        // Optional: log ignored updates for debugging
        console.log(`Passenger location ignored - moved only ${distanceMoved.toFixed(2)} meters`);
      }
    };

    const handlePositionError = (error: GeolocationError) => {
      dispatch(setTracking(false));
      console.error('Geolocation error:', error.message);
    };

    // One-shot fix so the map shows a pin immediately
    Geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      GEOLOCATION_GET_POSITION_CONFIG
    );

    // Configure watcher with better Android compatibility
    watchIdRef.current = Geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      GEOLOCATION_WATCHER_CONFIG
    );

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      watchStartedRef.current = false;
      dispatch(setTracking(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, session]);

  // Effect 3: Mirror isOnline into a ref so the watcher callback always reads
  // the latest value without the watcher ever needing to restart
  const isOnlineRef = useRef(isOnline);
  useEffect(() => {
    isOnlineRef.current = isOnline;

    if (!isOnline && session?.user.role === 'passenger') {
      void setPassengerOfflineState(session.user.id).catch(() => undefined);
    }
  }, [isOnline, session]);

  return {
    session,
    passengerLocation: currentLocation,
    isOnline,
    isTracking,
    isWaitingForRide,
    onToggleOnline,
    onLogout
  };
}
