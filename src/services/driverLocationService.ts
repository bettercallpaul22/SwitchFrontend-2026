/**
 * Driver Location Service
 * Handles all driver location and presence synchronization with Firestore
 */

import { upsertDriverPresence } from '../api/firestoreApi';
import type { DriverLiveLocation } from '../store/driverLocationSlice';

/**
 * Input shape for syncing driver presence
 */
export type DriverPresenceSyncInput = {
  driverId: string;
  isOnline: boolean;
  isAvailable: boolean;
  activeRideId?: string | null;
  location?: DriverLiveLocation | null;
};

/**
 * Syncs driver presence (status + optional location) to Firestore
 * Updates driver_locations collection with complete driver state
 */
export const syncDriverPresence = async ({
  driverId,
  isOnline,
  isAvailable,
  activeRideId = null,
  location = null,
}: DriverPresenceSyncInput) => {
  const updatedAt = location?.updatedAt ?? new Date().toISOString();

  await upsertDriverPresence({
    driverId,
    isOnline,
    isAvailable,
    activeRideId,
    updatedAt,
    location,
  });
};

/**
 * Syncs driver's current location with existing status
 * Used during location watcher updates
 */
export const syncDriverLiveLocation = async ({
  driverId,
  location,
  isOnline = true,
  isAvailable,
  activeRideId = null,
}: {
  driverId: string;
  location: DriverLiveLocation;
  isOnline?: boolean;
  isAvailable: boolean;
  activeRideId?: string | null;
}) => {
  await syncDriverPresence({
    driverId,
    isOnline,
    isAvailable,
    activeRideId,
    location,
  });
};

/**
 * Sets driver offline status
 * Preserves last known location in database
 */
export const setDriverOfflineState = async (
  driverId: string,
  location?: DriverLiveLocation | null,
) => {
  await syncDriverPresence({
    driverId,
    isOnline: false,
    isAvailable: false,
    activeRideId: null,
    location: location ?? null,
  });
};
