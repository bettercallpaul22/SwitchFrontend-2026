import {
  clearDriverActiveRide,
  respondToRideOfferAndDriverPresence
} from '../api/firestoreApi';
import type { DriverRideRequest, DriverRideRequestStatus } from '../types/driverRideRequest';

export const DRIVER_OFFER_STATUS = {
  accepted: 'accepted',
  skipped: 'skipped',
  expired: 'expired'
} as const;

type RespondToDriverRideRequestInput = {
  driverId: string;
  request: DriverRideRequest;
  status: DriverRideRequestStatus;
};

export const respondToDriverRideRequest = async ({
  driverId,
  request,
  status
}: RespondToDriverRideRequestInput): Promise<boolean> => {
  const now = new Date().toISOString();

  return respondToRideOfferAndDriverPresence({
    driverId,
    offerId: request.offerId,
    rideId: request.rideId,
    status,
    updatedAt: now
  });
};

export const clearDriverPendingRideRequest = async (
  driverId: string,
  request: DriverRideRequest
): Promise<void> => {
  const now = new Date().toISOString();
  await clearDriverActiveRide(driverId, now);
};
