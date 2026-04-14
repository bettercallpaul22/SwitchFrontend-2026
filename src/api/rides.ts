import { cancelRideRequestInFirestore } from './firestoreApi';
import { postJson } from './client';
import type { CreateRideRequestPayload, RideRequest } from '../types/ride';

export const createRideRequestApi = (payload: CreateRideRequestPayload) => {
  return postJson<CreateRideRequestPayload, RideRequest>('/api/rides/request', payload);
};

type CancelRideRequestPayload = {
  rideId: string;
  passengerId: string;
};

export const cancelRideRequestApi = async ({
  rideId,
  passengerId,
}: CancelRideRequestPayload): Promise<RideRequest> => {
  return cancelRideRequestInFirestore({
    rideId,
    passengerId,
  });
};
