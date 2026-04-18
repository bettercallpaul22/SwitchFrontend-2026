/**
 * Builds driver location document payload with all required fields
 */

import type { DriverLiveLocation } from '../../store/driverLocationSlice';

export type DriverLocationPayload = {
  driverId: string;
  isOnline: boolean;
  isAvailable: boolean;
  activeRideId: string | null;
  updatedAt: string;
  lat?: number;
  lng?: number;
  geohash?: string;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
};

/**
 * Builds a complete driver location payload
 * Always includes status fields, conditionally includes location fields
 */
export const buildDriverLocationPayload = ({
  driverId,
  isOnline,
  isAvailable,
  activeRideId,
  updatedAt,
  location,
}: {
  driverId: string;
  isOnline: boolean;
  isAvailable: boolean;
  activeRideId: string | null;
  updatedAt: string;
  location?: DriverLiveLocation | null;
}): DriverLocationPayload => {
  return {
    driverId,
    isOnline,
    isAvailable,
    activeRideId,
    updatedAt,
    ...(location && {
      lat: location.latitude,
      lng: location.longitude,
      geohash: location.geohash,
      heading: location.heading,
      speed: location.speed,
      accuracy: location.accuracy,
    }),
  };
};

/**
 * Merges location fields into an existing payload
 * Useful when you want to add location to an existing status update
 */
export const addLocationToPayload = (
  payload: DriverLocationPayload,
  location: DriverLiveLocation | null | undefined,
): DriverLocationPayload => {
  if (!location) return payload;

  return {
    ...payload,
    lat: location.latitude,
    lng: location.longitude,
    geohash: location.geohash,
    heading: location.heading,
    speed: location.speed,
    accuracy: location.accuracy,
  };
};

/**
 * Extracts only the location-specific fields from a payload
 */
export const extractLocationFields = (
  payload: DriverLocationPayload,
): Partial<DriverLocationPayload> => {
  return {
    lat: payload.lat,
    lng: payload.lng,
    geohash: payload.geohash,
    heading: payload.heading,
    speed: payload.speed,
    accuracy: payload.accuracy,
  };
};
