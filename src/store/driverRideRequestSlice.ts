import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { DriverRideRequest } from '../types/driverRideRequest';

type DriverRideRequestState = {
  currentRequest: DriverRideRequest | null;
};

const initialState: DriverRideRequestState = {
  currentRequest: null
};

const driverRideRequestSlice = createSlice({
  name: 'driverRideRequest',
  initialState,
  reducers: {
    setCurrentDriverRideRequest: (state, action: PayloadAction<DriverRideRequest>) => {
      state.currentRequest = action.payload;
    },
    dismissCurrentDriverRideRequest: (state, action: PayloadAction<{ offerId?: string } | undefined>) => {
      if (!state.currentRequest) {
        return;
      }

      if (!action.payload?.offerId || action.payload.offerId === state.currentRequest.offerId) {
        state.currentRequest = null;
      }
    },
    resetDriverRideRequestState: () => initialState
  }
});

export const {
  setCurrentDriverRideRequest,
  dismissCurrentDriverRideRequest,
  resetDriverRideRequestState
} = driverRideRequestSlice.actions;

export const driverRideRequestReducer = driverRideRequestSlice.reducer;
