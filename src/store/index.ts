import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE
} from 'redux-persist';

import { AuthState, authReducer } from './authSlice';
import { driverLocationReducer } from './driverLocationSlice';
import { driverRideRequestReducer } from './driverRideRequestSlice';
import { rideReducer } from './rideSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['activeRole', 'session']
};

const rootReducer = combineReducers({
  auth: persistReducer<AuthState>(authPersistConfig, authReducer),
  driverLocation: driverLocationReducer,
  driverRideRequest: driverRideRequestReducer,
  ride: rideReducer
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
