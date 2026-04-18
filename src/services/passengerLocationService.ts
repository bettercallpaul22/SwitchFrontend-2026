/**
 * Passenger Location Service
 * Manages synchronization of passenger location and status to Firestore
 * Uses @react-native-firebase for compatibility
 */

import firestore from '@react-native-firebase/firestore';
import type { GeolocationResponse } from '@react-native-community/geolocation';
import type { PassengerLiveLocation } from '../store/passengerLocationSlice';
import {
  buildPassengerLocationPayload,
  type PassengerLocationPayload,
} from '../utils/passengerLocation/payloadBuilder';
import { encodeGeohash } from '../utils/geohash';

const PASSENGER_LOCATIONS_COLLECTION = 'passenger_locations';

/**
 * Syncs passenger online/waiting status to passenger_locations
 * Called when passenger goes online/offline or starts/stops waiting
 */
export const syncPassengerPresence = async (payload: {
  passengerId: string;
  isOnline: boolean;
  isWaitingForRide: boolean;
  activeRideId: string | null;
  updatedAt: string;
  location?: PassengerLiveLocation | null;
}): Promise<void> => {
  try {
    const passengerLocationRef = firestore()
      .collection(PASSENGER_LOCATIONS_COLLECTION)
      .doc(payload.passengerId);

    const firestorePayload = buildPassengerLocationPayload({
      passengerId: payload.passengerId,
      isOnline: payload.isOnline,
      isWaitingForRide: payload.isWaitingForRide,
      activeRideId: payload.activeRideId,
      updatedAt: payload.updatedAt,
      location: payload.location,
    });

    await passengerLocationRef.set(firestorePayload, { merge: true });
  } catch (error) {
    console.error('Error syncing passenger presence:', error);
    throw error;
  }
};

/**
 * Syncs passenger live location (lat/lng) to passenger_locations
 * Called frequently during location tracking (every 5-10 seconds)
 */
export const syncPassengerLiveLocation = async (
  passengerId: string,
  geolocation: GeolocationResponse,
  geohash?: string
): Promise<void> => {
  try {
    const passengerLocationRef = firestore()
      .collection(PASSENGER_LOCATIONS_COLLECTION)
      .doc(passengerId);

    const geohashValue = geohash || encodeGeohash(
      geolocation.coords.latitude,
      geolocation.coords.longitude
    );

    const location: PassengerLiveLocation = {
      latitude: geolocation.coords.latitude,
      longitude: geolocation.coords.longitude,
      geohash: geohashValue,
      heading: geolocation.coords.heading ?? null,
      speed: geolocation.coords.speed ?? null,
      accuracy: geolocation.coords.accuracy ?? null,
      updatedAt: new Date().toISOString(),
    };

    const payload = buildPassengerLocationPayload({
      passengerId,
      isOnline: true,
      isWaitingForRide: false,
      activeRideId: null,
      updatedAt: location.updatedAt,
      location,
    });

    await passengerLocationRef.set(payload, { merge: true });
  } catch (error) {
    console.error('Error syncing passenger live location:', error);
    throw error;
  }
};

/**
 * Sets passenger to offline state in passenger_locations
 * Clears location data and status when passenger goes offline
 */
export const setPassengerOfflineState = async (
  passengerId: string
): Promise<void> => {
  try {
    const passengerLocationRef = firestore()
      .collection(PASSENGER_LOCATIONS_COLLECTION)
      .doc(passengerId);

    await passengerLocationRef.update({
      isOnline: false,
      isWaitingForRide: false,
      activeRideId: null,
      // Don't clear location data - keep last known location for reference
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting passenger offline state:', error);
    throw error;
  }
};

/**
 * Updates passenger ride status in passenger_locations
 * Called when passenger requests a ride or ride completes
 */
export const updatePassengerRideStatus = async (
  passengerId: string,
  isWaitingForRide: boolean,
  activeRideId: string | null
): Promise<void> => {
  try {
    const passengerLocationRef = firestore()
      .collection(PASSENGER_LOCATIONS_COLLECTION)
      .doc(passengerId);

    await passengerLocationRef.update({
      isWaitingForRide,
      activeRideId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating passenger ride status:', error);
    throw error;
  }
};

/**
 * Creates initial passenger_locations document during signup
 * Must be called after passenger is created in passengers collection
 */
export const createInitialPassengerLocationDoc = async (
  passengerId: string,
  updatedAt: string
): Promise<void> => {
  try {
    const passengerLocationRef = firestore()
      .collection(PASSENGER_LOCATIONS_COLLECTION)
      .doc(passengerId);

    const initialPayload: PassengerLocationPayload = {
      passengerId,
      isOnline: false,
      isWaitingForRide: false,
      activeRideId: null,
      updatedAt,
    };

    await passengerLocationRef.set(initialPayload);
  } catch (error) {
    console.error('Error creating initial passenger location document:', error);
    throw error;
  }
};

/**
 * Retrieves passenger live location from passenger_locations
 * Used for debugging or fetching current state
 */
export const getPassengerLocation = async (
  passengerId: string
): Promise<PassengerLocationPayload | null> => {
  try {
    const snapshot = await firestore()
      .collection(PASSENGER_LOCATIONS_COLLECTION)
      .doc(passengerId)
      .get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as PassengerLocationPayload;
  } catch (error) {
    console.error('Error retrieving passenger location:', error);
    throw error;
  }
};
