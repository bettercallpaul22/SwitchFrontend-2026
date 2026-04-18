import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PassengerLiveLocation = {
  latitude: number;
  longitude: number;
  geohash: string;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  updatedAt: string;
};

/**
 * Passenger location and status state
 * Tracks real-time location, ride status, and presence
 */
type PassengerLocationState = {
  currentLocation: PassengerLiveLocation | null;
  isTracking: boolean;
  isOnline: boolean; // Whether passenger is actively using app/searching
  isWaitingForRide: boolean; // True when ride request is active
  lastLocationUpdate: string | null;
};

const initialState: PassengerLocationState = {
  currentLocation: null,
  isTracking: false,
  isOnline: true,
  isWaitingForRide: false,
  lastLocationUpdate: null,
};

const passengerLocationSlice = createSlice({
  name: 'passengerLocation',
  initialState,
  reducers: {
    /**
     * Update current passenger location
     */
    setPassengerLocation(state, action: PayloadAction<PassengerLiveLocation>) {
      state.currentLocation = action.payload;
      state.lastLocationUpdate = action.payload.updatedAt;
    },

    /**
     * Toggle location tracking on/off
     */
    setTracking(state, action: PayloadAction<boolean>) {
      state.isTracking = action.payload;
    },

    /**
     * Set online/offline status
     */
    setPassengerOnlineStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },

    /**
     * Set waiting for ride status
     */
    setWaitingForRide(state, action: PayloadAction<boolean>) {
      state.isWaitingForRide = action.payload;
    },

    /**
     * Clear location data
     */
    clearPassengerLocation(state) {
      state.currentLocation = null;
      state.lastLocationUpdate = null;
      state.isTracking = false;
    },

    /**
     * Reset to initial state
     */
    resetPassengerLocationState() {
      return initialState;
    },
  },
});

export const {
  setPassengerLocation,
  setTracking,
  setPassengerOnlineStatus,
  setWaitingForRide,
  clearPassengerLocation,
  resetPassengerLocationState,
} = passengerLocationSlice.actions;

export const passengerLocationReducer = passengerLocationSlice.reducer;
