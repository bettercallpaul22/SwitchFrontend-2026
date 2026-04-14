import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LatLng } from 'react-native-maps';

export type DriverLiveLocation = LatLng & {
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  geohash: string;
  updatedAt: string;
};

export type DriverLocationState = {
  currentLocation: DriverLiveLocation | null;
  isOnline: boolean;
  isTracking: boolean;
  error: string | null;
};

const initialState: DriverLocationState = {
  currentLocation: null,
  isOnline: false,
  isTracking: false,
  error: null
};

const driverLocationSlice = createSlice({
  name: 'driverLocation',
  initialState,
  reducers: {
    setDriverOnlineState: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      state.error = null;

      if (!action.payload) {
        state.isTracking = false;
      }
    },
    setDriverTrackingState: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
    setDriverCurrentLocation: (state, action: PayloadAction<DriverLiveLocation>) => {
      state.currentLocation = action.payload;
      state.error = null;
    },
    setDriverLocationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetDriverLocationState: () => initialState
  }
});

export const {
  setDriverOnlineState,
  setDriverTrackingState,
  setDriverCurrentLocation,
  setDriverLocationError,
  resetDriverLocationState
} = driverLocationSlice.actions;

export const driverLocationReducer = driverLocationSlice.reducer;
