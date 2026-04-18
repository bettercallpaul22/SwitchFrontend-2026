import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { subscribePassengerProfileDocument } from '../api/firestoreApi';
import { updateRiderData } from '../store/authSlice';
import type { AppDispatch } from '../store/index';
import type { PassengerUser, PassengerRideStatus } from '../types/auth';

type FirestoreTimestampLike = FirebaseFirestoreTypes.Timestamp | Date | string | null | undefined;

type FirestorePassenger = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  fcmToken?: string;
  isOnline?: boolean;
  isAvailable?: boolean;
  activeRideId?: string | null;
  lastKnownLocation?: {
    lat?: number;
    lng?: number;
  } | null;
  lastKnownGeohash?: string;
  lastLocationUpdatedAt?: string;
  dateOfBirth?: string;
  walletBalance?: number;
  switchCoinBalance?: number;
  rideStatus?: string;
  termsAccepted?: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
};

const isTimestamp = (
  value: FirestoreTimestampLike,
): value is FirebaseFirestoreTypes.Timestamp =>
  value != null &&
  typeof value === 'object' &&
  'toDate' in value &&
  typeof value.toDate === 'function';

const toIsoString = (value: FirestoreTimestampLike): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isTimestamp(value)) {
    return value.toDate().toISOString();
  }

  return new Date().toISOString();
};

const normalizePassengerRideStatus = (rideStatus: string | null | undefined): PassengerRideStatus => {
  if (!rideStatus) return 'idle';

  switch (rideStatus.trim().toLowerCase()) {
    case 'requested':
    case 'requesting':
    case 'searching_driver':
      return 'requested';
    case 'accepted':
      return 'accepted';
    case 'arrived':
      return 'arrived';
    case 'on_trip':
    case 'on_ride':
      return 'on_trip';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'idle';
  }
};

const normalizePassengerData = (
  id: string,
  data: FirestorePassenger,
): Partial<PassengerUser> => ({
  id,
  firstName: data.firstName ?? '',
  lastName: data.lastName ?? '',
  email: data.email ?? '',
  phone: data.phone ?? '',
  fcmToken: data.fcmToken ?? '',
  isOnline: data.isOnline,
  isAvailable: data.isAvailable,
  activeRideId: data.activeRideId ?? null,
  lastKnownLocation: data.lastKnownLocation
    ? {
        lat: data.lastKnownLocation.lat ?? 0,
        lng: data.lastKnownLocation.lng ?? 0,
      }
    : undefined,
  lastKnownGeohash: data.lastKnownGeohash,
  lastLocationUpdatedAt: data.lastLocationUpdatedAt,
  dateOfBirth: data.dateOfBirth,
  walletBalance: data.walletBalance ?? 0,
  switchCoinBalance: data.switchCoinBalance ?? 0,
  rideStatus: normalizePassengerRideStatus(data.rideStatus),
  ...(data.termsAccepted === true ? { termsAccepted: true } : {}),
  createdAt: toIsoString(data.createdAt),
  updatedAt: toIsoString(data.updatedAt),
});

/**
 * Listens to a rider's (passenger's) profile data in Firestore in real-time.
 * When the document changes, automatically updates the Redux store with the new data.
 *
 * @param riderId - The UID of the rider/passenger
 * @param dispatch - Redux dispatch function
 * @param onError - Optional error callback
 * @returns Unsubscribe function — call it to stop listening
 */
export function listenToRiderData(
  riderId: string,
  dispatch: AppDispatch,
  onError?: (error: Error) => void,
): () => void {
//   console.log('[riderListener] Starting to listen for rider data:', { riderId });
  
  return subscribePassengerProfileDocument(
    riderId,
    (data) => {
      console.log('[riderListener] Received Firestore data:', data);
      try {
        const normalizedData = normalizePassengerData(riderId, data as FirestorePassenger);
        // console.log('[riderListener] Normalized rider data:', normalizedData);
        // console.log('[riderListener] Dispatching updateRiderData action');
        dispatch(updateRiderData(normalizedData));
        // console.log('[riderListener] Dispatch successful');
      } catch (error) {
        console.error('[riderListener] Error normalizing rider data:', error);
        onError?.(error as Error);
      }
    },
    (error) => {
      console.error('[riderListener] Firestore error:', error);
      onError?.(error);
    },
  );
}
