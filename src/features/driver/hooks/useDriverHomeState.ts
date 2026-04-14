import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import type {
  GeolocationError,
  GeolocationResponse
} from '@react-native-community/geolocation';
import type { LatLng } from 'react-native-maps';

import type { RideRequestRoute } from '../../../components/maps';
import { logout, updateDriverSessionLocation } from '../../../store/authSlice';
import {
  DriverLiveLocation,
  resetDriverLocationState,
  setDriverCurrentLocation,
  setDriverLocationError,
  setDriverOnlineState,
  setDriverTrackingState
} from '../../../store/driverLocationSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setDriverOfflineState,
  syncDriverLiveLocation,
  syncDriverPresence
} from '../../../services/driverLocationService';
import { encodeGeohash } from '../../../utils/geohash';

const SAMPLE_RIDE_REQUEST: RideRequestRoute = {
  pickupLocation: {
    latitude: 9.05785,
    longitude: 7.49508
  },
  destinationLocation: {
    latitude: 9.04104,
    longitude: 7.48948
  }
};

const LOCATION_DISTANCE_THRESHOLD_IN_METERS = 2;

const toRadians = (value: number) => (value * Math.PI) / 180;

const calculateDistanceInMeters = (from: LatLng, to: LatLng) => {
  const earthRadius = 6371000;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const startLat = toRadians(from.latitude);
  const endLat = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

const buildDriverLiveLocation = (position: GeolocationResponse): DriverLiveLocation => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  heading: Number.isFinite(position.coords.heading) ? position.coords.heading : null,
  speed: Number.isFinite(position.coords.speed) ? position.coords.speed : null,
  accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
  geohash: encodeGeohash(position.coords.latitude, position.coords.longitude),
  updatedAt: new Date(position.timestamp).toISOString()
});

export function useDriverHomeState() {
  const dispatch = useAppDispatch();
  const { session } = useAppSelector((state) => state.auth);
  const { currentLocation, isOnline, isTracking } = useAppSelector((state) => state.driverLocation);
  console.log("currentLocation", currentLocation);
  const [rideRequest, setRideRequest] = useState<RideRequestRoute | null>(null);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastSyncedLocationRef = useRef<DriverLiveLocation | null>(null);
  const syncLocationRef = useRef<(location: DriverLiveLocation) => Promise<void>>(async () => {});

  const initials = useMemo(() => {
    if (!session) {
      return 'DR';
    }

    const first = session.user.firstName?.[0] ?? '';
    const last = session.user.lastName?.[0] ?? '';
    const value = `${first}${last}`.toUpperCase();

    return value.length > 0 ? value : 'DR';
  }, [session]);

  const onToggleOnline = useCallback(async () => {
    if (!session || session.user.role !== 'driver' || isTogglingOnline) {
      return;
    }

    const next = !isOnline;

    setIsTogglingOnline(true);
    
    console.log(`[useDriverHomeState] Toggling online state: ${isOnline} → ${next}`);
console.log("driverid", session.user.id);
    try {
      await syncDriverPresence({
        driverId: session.user.id,
        isOnline: next,
        isAvailable: next && !rideRequest,
        activeRideId: null,
        location: currentLocation
      });

      // Only update Redux AFTER Firestore succeeds
      dispatch(setDriverOnlineState(next));

      if (!next) {
        setRideRequest(null);
      }

      console.log(`[useDriverHomeState] ✅ Online state successfully updated to: ${next}`);
      
    } catch (error) {
      console.error(`[useDriverHomeState] ❌ Failed to toggle online state`, error);
      
      dispatch(
        setDriverLocationError(
          error instanceof Error ? error.message : 'Unable to update driver online state'
        )
      );
    } finally {
      setIsTogglingOnline(false);
    }
  }, [currentLocation, dispatch, isOnline, isTogglingOnline, rideRequest, session]);

  const onToggleRideRequestPreview = useCallback(() => {
    if (!isOnline) {
      return;
    }

    setRideRequest((current) => (current ? null : SAMPLE_RIDE_REQUEST));
  }, [isOnline]);

  const onLogout = useCallback(() => {
    if (session?.user.role === 'driver') {
      void setDriverOfflineState(session.user.id).catch(() => undefined);
    }

    dispatch(resetDriverLocationState());
    dispatch(logout());
  }, [dispatch, session]);

  // Seed Redux with the last known location from the session on mount
  useEffect(() => {
    if (!session || session.user.role !== 'driver') {
      return;
    }

    if (!currentLocation && session.user.lastKnownLocation) {
      dispatch(
        setDriverCurrentLocation({
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
        })
      );
    }
  }, [currentLocation, dispatch, session]);

  // Effect 1: Keep syncLocationRef current whenever rideRequest or session changes.
  // This lets the watcher effect always call the latest closure without restarting
  // the watcher itself.
  useEffect(() => {
    syncLocationRef.current = async (location: DriverLiveLocation) => {
      const previousLocation = lastSyncedLocationRef.current;
      const movedEnough = previousLocation
        ? calculateDistanceInMeters(previousLocation, location) >= LOCATION_DISTANCE_THRESHOLD_IN_METERS
        : true;

      if (!movedEnough) {
        return;
      }

      // Set the ref BEFORE the async call to prevent races where a second
      // position update arrives before syncDriverLiveLocation resolves.
      lastSyncedLocationRef.current = location;

      dispatch(setDriverCurrentLocation(location));
      dispatch(
        updateDriverSessionLocation({
          lat: location.latitude,
          lng: location.longitude,
          updatedAt: location.updatedAt
        })
      );

      console.log('[driverLocation] accepted update',  {
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: location.updatedAt,
        distanceFromLastAcceptedMeters: previousLocation
          ? Number(calculateDistanceInMeters(previousLocation, location).toFixed(2))
          : null
      });

      await syncDriverLiveLocation({
        driverId: session!.user.id,
        location,
        isOnline: true,
        isAvailable: !rideRequest,
        activeRideId: null
      });
    };
  }, [dispatch, rideRequest, session]);

  // Effect 2: Manage the geolocation watcher.
  // rideRequest is intentionally excluded from deps — changing the ride request
  // must NOT restart the watcher or reset lastSyncedLocationRef.
  useEffect(() => {
    if (!session || session.user.role !== 'driver') {
      return;
    }
console.log(`[useDriverHomeState] Setting up geolocation watcher. isOnline: ${isOnline}, session.user.id: ${session.user.id}`);
    if (!isOnline) {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      dispatch(setDriverTrackingState(false));
      dispatch(setDriverLocationError(null));
      // Only reset the synced location ref when the driver actually goes offline
      lastSyncedLocationRef.current = null;

      void setDriverOfflineState(session.user.id).catch((error) => {
        dispatch(
          setDriverLocationError(
            error instanceof Error ? error.message : 'Unable to update driver offline state'
          )
        );
      });

      return;
    }

    const handlePositionSuccess = (position: GeolocationResponse) => {
      console.log('✅ [GEO] Position received successfully:', {
        timestamp: position.timestamp,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed
      });
      
      const location = buildDriverLiveLocation(position);
      console.log('🔨 [GEO] Built location object:', location);

      dispatch(setDriverTrackingState(true));
      dispatch(setDriverLocationError(null));

      console.log('📤 [GEO] Sending location to sync handler');
      // Call through the ref so we always use the latest syncLocation closure
      // without needing rideRequest in this effect's dependency array.
      void syncLocationRef.current(location).catch((error) => {
        console.error('❌ [GEO] Sync location failed:', error);
        dispatch(
          setDriverLocationError(
            error instanceof Error ? error.message : 'Unable to sync driver location'
          )
        );
      });
    };

    const handlePositionError = (error: GeolocationError) => {
      console.error('❌ [GEO] Position error received:', {
        code: error.code,
        message: error.message,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      });
      dispatch(setDriverTrackingState(false));
      dispatch(setDriverLocationError(error.message));
    };

    // Get an immediate fix on coming online
    console.log('📍 [GEO] Requesting initial current position...');
    Geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    });

    // Keep a live driver watch running while online:
    // - `enableHighAccuracy` prefers GPS-quality updates for routing.
    // - `distanceFilter: 2` tells the OS to only emit after ~2 m of movement.
    // - `interval` / `fastestInterval` cap Android poll/delivery frequency.
    // - `maximumAge` allows a very recent cached fix to reduce startup delay.
    console.log('👁️ [GEO] Starting watchPosition tracker...');
    watchIdRef.current = Geolocation.watchPosition(handlePositionSuccess, handlePositionError, {
      enableHighAccuracy: true,
      distanceFilter: 2,
      interval: 8000,
      fastestInterval: 5000,
      maximumAge: 3000
    });
    
    console.log('✅ [GEO] Watch position started with ID:', watchIdRef.current);

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      dispatch(setDriverTrackingState(false));
    };
  }, [dispatch, isOnline, session]); // rideRequest intentionally omitted

  return {
    session,
    driverLocation: currentLocation,
    isOnline,
    isTracking,
    rideRequest,
    initials,
    isTogglingOnline,
    onToggleOnline,
    onToggleRideRequestPreview,
    onLogout
  };
}
