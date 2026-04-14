import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  FirebaseFirestoreTypes,
  updateDoc,
} from '@react-native-firebase/firestore';

import { db } from '../config/firebase';
import type { DriverLiveLocation } from '../store/driverLocationSlice';
import type { DriverRideRequestStatus } from '../types/driverRideRequest';
import type { RideRequest } from '../types/ride';

const PASSENGERS_COLLECTION = 'passengers';
const DRIVERS_COLLECTION = 'drivers';
const RIDES_COLLECTION = 'rides';
const RIDE_OFFERS_COLLECTION = 'ride_offers';

const passengersCollection = collection(db, PASSENGERS_COLLECTION);
const driversCollection = collection(db, DRIVERS_COLLECTION);
const ridesCollection = collection(db, RIDES_COLLECTION);
const rideOffersCollection = collection(db, RIDE_OFFERS_COLLECTION);

export type StoredUserRole = 'passenger' | 'driver';

export type DriverPresenceWritePayload = {
  driverId: string;
  isOnline: boolean;
  isAvailable: boolean;
  activeRideId: string | null;
  updatedAt: string;
  location?: DriverLiveLocation | null;
};

type RideOfferDocument = {
  id?: string;
  rideId?: string;
  driverId?: string;
  status?: string;
};

export type PassengerRideDoc = { id: string; data: FirebaseFirestoreTypes.DocumentData };

export const getPassengerProfileDoc = async (userId: string) => {
  return getDoc(doc(passengersCollection, userId));
};

export const getDriverProfileDoc = async (userId: string) => {
  return getDoc(doc(driversCollection, userId));
};

export const createPassengerProfileDoc = async (
  userId: string,
  payload: Record<string, unknown>
) => {
  await setDoc(doc(passengersCollection, userId), payload, { merge: false });
};

export const createDriverProfileDoc = async (
  userId: string,
  payload: Record<string, unknown>
) => {
  await setDoc(doc(driversCollection, userId), payload, { merge: false });
};

export const mergeDriverProfileDoc = async (
  driverId: string,
  payload: Record<string, unknown>
) => {
  await setDoc(doc(driversCollection, driverId), payload, { merge: true });
};

export const mergeUserFcmTokenDoc = async (
  role: StoredUserRole,
  userId: string,
  payload: Record<string, unknown>
) => {
  const userRef =
    role === 'passenger'
      ? doc(passengersCollection, userId)
      : doc(driversCollection, userId);
  await setDoc(userRef, payload, { merge: true });
};

export const upsertDriverPresence = async ({
  driverId,
  isOnline,
  isAvailable,
  activeRideId,
  updatedAt,
  location,
}: DriverPresenceWritePayload) => {
  // console.log(`[FirestoreApi] 🔄 UPSERT DRIVER PRESENCE START`, {
  //   driverId,
  //   isOnline,
  //   isAvailable,
  //   activeRideId,
  //   hasLocation: !!location,
  //   timestamp: updatedAt
  // });

  const startTime = Date.now();

  const driverLocationPayload = {
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
          accuracy: location.accuracy,
        }
      : {}),
  };

  const driverDocRef = doc(driversCollection, driverId);
  // console.log(`[FirestoreApi] 📝 Updating driver document: ${driverDocRef.path}`, driverLocationPayload);
  
  await updateDoc(driverDocRef, driverLocationPayload);

  

  const duration = Date.now() - startTime;
  
  // console.log(`[FirestoreApi] ✅ UPSERT DRIVER PRESENCE SUCCESS`, {
  //   driverId,
  //   isOnline,
  //   durationMs: duration,
  // });

  return driverLocationPayload;
};

export const respondToRideOfferAndDriverPresence = async (input: {
  driverId: string;
  offerId: string;
  rideId: string;
  status: DriverRideRequestStatus;
  updatedAt: string;
}) => {
  const offerRef = doc(rideOffersCollection, input.offerId);
  const driverLocationRef = doc(driversCollection, input.driverId);
  const driverRef = doc(driversCollection, input.driverId);

  return runTransaction(db, async (transaction) => {
    const offerSnapshot = await transaction.get(offerRef);
    if (!offerSnapshot.exists) {
      return false;
    }

    const offerData = offerSnapshot.data() as RideOfferDocument;
    if (!offerData || offerData.driverId !== input.driverId || offerData.rideId !== input.rideId) {
      return false;
    }

    if (offerData.status && offerData.status !== 'pending') {
      return false;
    }

    transaction.update(offerRef, {
      status: input.status,
      respondedAt: input.updatedAt,
      updatedAt: input.updatedAt,
    });

    const nextActiveRideId = input.status === 'accepted' ? input.rideId : null;
    const nextIsAvailable = input.status !== 'accepted';

    const sharedPayload = {
      driverId: input.driverId,
      activeRideId: nextActiveRideId,
      isAvailable: nextIsAvailable,
      updatedAt: input.updatedAt,
    };

    transaction.set(driverLocationRef, sharedPayload, { merge: true });
    transaction.set(driverRef, sharedPayload, { merge: true });

    return true;
  });
};

export const clearDriverActiveRide = async (driverId: string, updatedAt: string) => {
  const payload = {
    driverId,
    activeRideId: null,
    isAvailable: true,
    updatedAt,
  };

  await updateDoc(doc(driversCollection, driverId), payload);
};

export const cancelRideRequestInFirestore = async ({
  rideId,
  passengerId,
}: {
  rideId: string;
  passengerId: string;
}): Promise<RideRequest> => {
  const rideRef = doc(ridesCollection, rideId);
  const passengerRef = doc(passengersCollection, passengerId);

  return runTransaction(db, async (transaction) => {
    const [rideSnapshot, passengerSnapshot] = await Promise.all([
      transaction.get(rideRef),
      transaction.get(passengerRef),
    ]);

    if (!rideSnapshot.exists) {
      throw new Error('Ride not found');
    }

    if (!passengerSnapshot.exists) {
      throw new Error('Passenger record not found');
    }

    const rideData = rideSnapshot.data() as RideRequest;

    if (rideData.passengerId !== passengerId) {
      throw new Error('You are not allowed to cancel this ride');
    }

    transaction.update(rideRef, {
      status: 'cancelled',
      cancelBy: 'passenger',
      updatedAt: serverTimestamp(),
    });

    transaction.update(passengerRef, {
      rideStatus: 'idle',
      activeRideId: null,
      updatedAt: serverTimestamp(),
    });

    return {
      ...rideData,
      id: rideSnapshot.id,
      status: 'cancelled',
      cancelBy: 'passenger',
      stopLocation: rideData.stopLocation ?? undefined,
      updatedAt: new Date().toISOString(),
    };
  });
};

export const subscribePassengerRideDocuments = (
  passengerId: string,
  onNext: (docs: PassengerRideDoc[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const ridesQuery = query(ridesCollection, where('passengerId', '==', passengerId));

  return onSnapshot(
    ridesQuery,
    (snapshot) => {
      onNext(snapshot.docs.map((docItem) => ({ id: docItem.id, data: docItem.data() })));
    },
    (error) => {
      onError?.(error);
    }
  );
};
