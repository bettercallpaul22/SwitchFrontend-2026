/**
 * Passenger Location Payload Builder
 * Constructs Firestore documents for passenger_locations collection
 */

import type { PassengerLiveLocation } from '../../store/passengerLocationSlice';

export type PassengerLocationPayload = {
  passengerId: string;
  isOnline: boolean;
  isWaitingForRide: boolean;
  activeRideId: string | null;
  updatedAt: string;
  latitude?: number;
  longitude?: number;
  geohash?: string;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
};

/**
 * Builds complete passenger location payload for Firestore
 * Includes location data, status, and metadata
 */
export const buildPassengerLocationPayload = ({
  passengerId,
  isOnline,
  isWaitingForRide,
  activeRideId,
  updatedAt,
  location,
}: {
  passengerId: string;
  isOnline: boolean;
  isWaitingForRide: boolean;
  activeRideId: string | null;
  updatedAt: string;
  location?: PassengerLiveLocation | null;
}): PassengerLocationPayload => ({
  passengerId,
  isOnline,
  isWaitingForRide,
  activeRideId,
  updatedAt,
  ...(location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    geohash: location.geohash,
    heading: location.heading ?? null,
    speed: location.speed ?? null,
    accuracy: location.accuracy ?? null,
  } : {}),
});

/**
 * Adds location data to existing status payload
 * Useful for partial updates when only location changed
 */
export const addLocationToPassengerPayload = (
  payload: PassengerLocationPayload,
  location: PassengerLiveLocation
): PassengerLocationPayload => ({
  ...payload,
  latitude: location.latitude,
  longitude: location.longitude,
  geohash: location.geohash,
  heading: location.heading ?? null,
  speed: location.speed ?? null,
  accuracy: location.accuracy ?? null,
  updatedAt: location.updatedAt,
});

/**
 * Extracts location-specific fields from payload
 * Returns only lat/lng/geohash/heading/speed/accuracy
 */
export const extractLocationFields = (
  payload: PassengerLocationPayload
): Partial<PassengerLocationPayload> => ({
  latitude: payload.latitude,
  longitude: payload.longitude,
  geohash: payload.geohash,
  heading: payload.heading,
  speed: payload.speed,
  accuracy: payload.accuracy,
  updatedAt: payload.updatedAt,
});
