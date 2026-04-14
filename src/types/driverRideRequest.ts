export type DriverRideRequestStatus = 'accepted' | 'skipped' | 'expired';

export type DriverRideRequest = {
  rideId: string;
  offerId: string;
  passengerId: string;
  pickupAddress: string;
  destinationAddress: string;
  paymentMethod: string;
  requestedAt: string;
  expiresAt: string;
};
