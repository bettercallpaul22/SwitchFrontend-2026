/**
 * Driver Location Tracking Configuration and Constants
 */

import type { DriverLiveLocation } from '../store/driverLocationSlice';
import { encodeGeohash } from './geohash';

/**
 * Minimum distance (in meters) driver must move before update
 * Prevents excessive database writes while driver is stationary
 */
export const LOCATION_DISTANCE_THRESHOLD_IN_METERS = 10;

/**
 * Geolocation watcher configuration
 */
export const GEOLOCATION_WATCHER_CONFIG = {
  enableHighAccuracy: true,
  maximumAge: 3000,
  timeout: 20000,
  // NOTE: distanceFilter is removed as it's unreliable on Android
  // Distance filtering is handled manually in the callback
} as const;

/**
 * One-shot geolocation configuration for initial position
 */
export const GEOLOCATION_GET_POSITION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
} as const;

/**
 * Builds a DriverLiveLocation from GeolocationResponse
 */
export const buildDriverLiveLocation = (position: {
  coords: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    accuracy?: number | null;
  };
  timestamp: number;
}): DriverLiveLocation => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  heading: Number.isFinite(position.coords.heading ?? 0) ? position.coords.heading ?? null : null,
  speed: Number.isFinite(position.coords.speed ?? 0) ? position.coords.speed ?? null : null,
  accuracy: Number.isFinite(position.coords.accuracy ?? 0) ? position.coords.accuracy ?? null : null,
  geohash: encodeGeohash(position.coords.latitude, position.coords.longitude),
  updatedAt: new Date(position.timestamp).toISOString(),
});

/**
 * Calculates distance between two locations in meters using Haversine formula
 */
export const calculateDistanceInMeters = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number => {
  const R = 6371000; // Earth radius in meters
  const dLat = (to.latitude - from.latitude) * (Math.PI / 180);
  const dLng = (to.longitude - from.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.latitude * (Math.PI / 180)) *
      Math.cos(to.latitude * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
