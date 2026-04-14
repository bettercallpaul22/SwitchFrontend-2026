import { upsertDriverPresence } from '../api/firestoreApi';
import type { DriverLiveLocation } from '../store/driverLocationSlice';

export type DriverLocationSyncPayload = {
  driverId: string;
  location: DriverLiveLocation;
  isOnline: boolean;
  isAvailable: boolean;
  activeRideId?: string | null;
};

type DriverPresenceSyncPayload = {
  driverId: string;
  isOnline: boolean;
  isAvailable: boolean;
  activeRideId?: string | null;
  location?: DriverLiveLocation | null;
};

const buildDriverPresencePayload = ({
  driverId,
  isOnline,
  isAvailable,
  activeRideId,
  location,
  updatedAt
}: {
  driverId: string;
  isOnline: boolean;
  isAvailable: boolean;
  activeRideId: string | null;
  location?: DriverLiveLocation | null;
  updatedAt: string;
}) => {
  return {
    driverId,
    isOnline,
    isAvailable,
    activeRideId,
    updatedAt,
    ...(location
      ? {
          lat: location.latitude,
          lng: location.longitude,
          geohash: location.geohash,
          heading: location.heading,
          speed: location.speed,
          accuracy: location.accuracy
        }
      : {})
  };
};

export const syncDriverPresence = async ({
  driverId,
  isOnline,
  isAvailable,
  activeRideId = null,
  location = null
}: DriverPresenceSyncPayload) => {
  const updatedAt = location?.updatedAt ?? new Date().toISOString();

  const driverLocationPayload = buildDriverPresencePayload({
    driverId,
    isOnline,
    isAvailable,
    activeRideId,
    location,
    updatedAt
  });

  await upsertDriverPresence({
    driverId,
    isOnline,
    isAvailable,
    activeRideId,
    updatedAt,
    location
  });

  return driverLocationPayload;
};

export const syncDriverLiveLocation = async ({
  driverId,
  location,
  isOnline,
  isAvailable,
  activeRideId = null
}: DriverLocationSyncPayload) => {
  return syncDriverPresence({
    driverId,
    isOnline,
    isAvailable,
    activeRideId,
    location
  });
};

export const setDriverOfflineState = async (driverId: string) => {
  await syncDriverPresence({
    driverId,
    isOnline: false,
    isAvailable: false,
    activeRideId: null
  });
};
