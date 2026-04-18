import React, { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setCurrentRide,
  updateRideStatus,
  updateRideEstimates,
  clearCurrentRide,
  setLoading,
} from '../../store/driverCurrentRideSlice';
import { RideRequestSheet } from './RideRequestSheet';
import { RideAcceptedSheet } from './RideAcceptedSheet';
import { RideOnTripSheet } from './RideOnTripSheet';
import { RideArrivedSheet } from './RideArrivedSheet';
import { RideCompletedSheet } from './RideCompletedSheet';
import type { DriverRideRequest } from '../../types/driverRideRequest';
import type { DriverCurrentRide } from '../../store/driverCurrentRideSlice';

/**
 * Main orchestrator for all driver ride-related bottom sheets
 * Renders the appropriate sheet based on current ride status
 *
 * Handles:
 * - Ride request incoming (requested status)
 * - Accept ride (accepted status)
 * - En route to pickup/destination (on_trip status)
 * - Arrived at pickup/destination (arrived status)
 * - Ride completed (completed status)
 */
export function DriverRideSheetHost() {
  const dispatch = useAppDispatch();
  const currentRide = useAppSelector((state) => state.driverCurrentRide.currentRide);
  const isLoading = useAppSelector((state) => state.driverCurrentRide.isLoading);
  const driverId = useAppSelector((state) => state.auth.session?.user.id);

  // Don't render if no driver session
  if (!driverId) {
    return null;
  }

  // ===== RIDE REQUEST (incoming request) =====
  const handleRideRequestAccept = useCallback(
    async (request: DriverRideRequest) => {
      try {
        dispatch(setLoading(true));
        // TODO: Call API to accept the ride
        // For now, we'll convert the ride request to a current ride with accepted status
        const newRide: DriverCurrentRide = {
          id: request.rideId,
          status: 'accepted',
          passengerId: request.passengerId,
          passengerName: 'Passenger', // Should come from API
          pickupAddress: request.pickupAddress,
          destinationAddress: request.destinationAddress,
          paymentMethod: request.paymentMethod,
          estimatedPickupTime: '5 mins', // Calculate from location
        };
        dispatch(setCurrentRide(newRide));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleRideRequestSkip = useCallback(
    (request: DriverRideRequest) => {
      // API call to skip the ride request
      // Then dismiss it
      dispatch(clearCurrentRide());
    },
    [dispatch]
  );

  // ===== RIDE ACCEPTED (heading to pickup) =====
  const handleStartTrip = useCallback(
    async () => {
      try {
        dispatch(setLoading(true));
        // TODO: Call API to start the trip
        if (currentRide) {
          dispatch(
            updateRideStatus('on_trip')
          );
        }
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, currentRide]
  );

  const handleCancelRide = useCallback(
    async () => {
      try {
        dispatch(setLoading(true));
        // TODO: Call API to cancel the ride
        dispatch(clearCurrentRide());
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  // ===== RIDE ON TRIP (en route) =====
  const handleArrived = useCallback(
    async () => {
      try {
        dispatch(setLoading(true));
        // TODO: Call API to mark as arrived
        if (currentRide) {
          dispatch(
            updateRideStatus('arrived')
          );
        }
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, currentRide]
  );

  const handleEmergency = useCallback(
    () => {
      // TODO: Show emergency alert or contact support
      console.log('Emergency button pressed');
    },
    []
  );

  // ===== RIDE ARRIVED =====
  const handleConfirmArrival = useCallback(
    async () => {
      try {
        dispatch(setLoading(true));
        // TODO: Call API to confirm arrival
        if (currentRide && currentRide.status === 'arrived') {
          // If we were at pickup, move to on_trip
          // If we were at destination, move to completed
          // For now, we'll assume arrival at destination means completion
          dispatch(
            updateRideStatus('completed')
          );
        }
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, currentRide]
  );

  // ===== RIDE COMPLETED =====
  const handleRatePassenger = useCallback(
    () => {
      // TODO: Open passenger rating modal/sheet
      console.log('Rate passenger');
    },
    []
  );

  const handleCompleteRide = useCallback(
    async () => {
      try {
        dispatch(setLoading(true));
        // TODO: Final API call to close the ride
        dispatch(clearCurrentRide());
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  // Sheet visibility based on ride status
  const showRequestSheet = useMemo(() => {
    return !currentRide;
  }, [currentRide]);

  return (
    <>
      {/* Ride Request - Show when no current ride */}
      {showRequestSheet && (
        <RideRequestSheetHost
          onAccept={handleRideRequestAccept}
          onSkip={handleRideRequestSkip}
        />
      )}

      {/* Accepted Sheet - Driver heading to pickup */}
      {currentRide && currentRide.status === 'accepted' && (
        <RideAcceptedSheet
          visible={true}
          ride={{
            id: currentRide.id,
            pickupAddress: currentRide.pickupAddress,
            destinationAddress: currentRide.destinationAddress,
            passengerName: currentRide.passengerName,
            passengerPhone: currentRide.passengerPhone || '',
            estimatedPickupTime: currentRide.estimatedPickupTime || '5 mins',
            paymentMethod: currentRide.paymentMethod || 'Cash',
          }}
          onStartTrip={handleStartTrip}
          onCancel={handleCancelRide}
          isLoading={isLoading}
        />
      )}

      {/* On Trip Sheet - Driver en route with passenger */}
      {currentRide && currentRide.status === 'on_trip' && (
        <RideOnTripSheet
          visible={true}
          ride={{
            id: currentRide.id,
            pickupAddress: currentRide.pickupAddress,
            destinationAddress: currentRide.destinationAddress,
            passengerName: currentRide.passengerName,
            estimatedTimeRemaining: currentRide.estimatedTimeRemaining || '8 mins',
            estimatedDistance: currentRide.estimatedDistance || '2.5 km',
          }}
          onArrived={handleArrived}
          onEmergency={handleEmergency}
          isLoading={isLoading}
        />
      )}

      {/* Arrived Sheet - Driver arrived at pickup or destination */}
      {currentRide && currentRide.status === 'arrived' && (
        <RideArrivedSheet
          visible={true}
          ride={{
            id: currentRide.id,
            destinationAddress: currentRide.destinationAddress,
            passengerName: currentRide.passengerName,
            arrivalType: 'destination', // In real app, determine based on ride progress
            tripDuration: currentRide.tripDuration,
            tripDistance: currentRide.tripDistance,
          }}
          onConfirmArrival={handleConfirmArrival}
          isLoading={isLoading}
        />
      )}

      {/* Completed Sheet - Trip finished */}
      {currentRide && currentRide.status === 'completed' && (
        <RideCompletedSheet
          visible={true}
          ride={{
            id: currentRide.id,
            passengerName: currentRide.passengerName,
            pickupAddress: currentRide.pickupAddress,
            destinationAddress: currentRide.destinationAddress,
            tripDuration: currentRide.tripDuration || '15 mins',
            tripDistance: currentRide.tripDistance || '8.5 km',
            fare: currentRide.fare || 250.0,
            currency: currentRide.currency || 'INR',
          }}
          onRatePassenger={handleRatePassenger}
          onClose={handleCompleteRide}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

/**
 * Sub-component: Handles ride request incoming (existing logic)
 * This wraps the existing RideRequestSheet with request-specific logic
 * For now, it imports from driverRideRequestSlice
 */
function RideRequestSheetHost({
  onAccept,
  onSkip,
}: {
  onAccept: (request: DriverRideRequest) => void;
  onSkip: (request: DriverRideRequest) => void;
}) {
  const dispatch = useAppDispatch();
  const currentRequest = useAppSelector((state) => state.driverRideRequest.currentRequest);

  const handleAccept = useCallback(
    (request: DriverRideRequest) => {
      onAccept(request);
      // Dismiss the request sheet
      dispatch({
        type: 'driverRideRequest/dismissCurrentDriverRideRequest',
        payload: { offerId: request.offerId },
      });
    },
    [onAccept, dispatch]
  );

  const handleSkip = useCallback(
    (request: DriverRideRequest) => {
      onSkip(request);
      // Hide the request sheet
      dispatch({
        type: 'driverRideRequest/dismissCurrentDriverRideRequest',
        payload: { offerId: request.offerId },
      });
    },
    [onSkip, dispatch]
  );

  return (
    <RideRequestSheet
      visible={Boolean(currentRequest)}
      request={currentRequest}
      onAccept={handleAccept}
      onSkip={handleSkip}
      onExpired={handleSkip}
    />
  );
}

export { RideRequestSheetHost };
