import React, { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  checkMultiple,
  openSettings,
  PERMISSIONS,
  requestMultiple,
  RESULTS,
} from 'react-native-permissions';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import {
  clearSessionState,
  hydrateAuthStatus,
  restoreSession,
  updatePassengerRideState,
  updateSessionFcmToken,
} from './src/store/authSlice';
import { useAppSelector } from './src/store/hooks';
import { persistor, store } from './src/store';
import { listenToActivePassengerRide } from './src/listeners';
import { setRide } from './src/store/rideSlice';
import { syncCurrentUserFcmToken } from './src/services/authService';
import { DriverRideRequestSheetHost } from './src/components/bottomsheets';

function RootNavigator() {
  const { session } = useAppSelector((state) => state.auth);
  const unsubscribeRideRef = useRef<(() => void) | null>(null);
  const unsubscribeTokenRefreshRef = useRef<(() => void) | null>(null);
  const [authReady, setAuthReady] = React.useState(false);

  useEffect(() => {
    const auth = getAuth();

    const syncFcmToken = async (token?: string) => {
      try {
        const updatedUser = await syncCurrentUserFcmToken(token);

        if (!updatedUser) {
          return;
        }

        store.dispatch(
          updateSessionFcmToken({
            fcmToken: updatedUser.fcmToken,
            updatedAt: updatedUser.updatedAt,
          }),
        );
      } catch (error) {
        console.log('[RootNavigator] syncCurrentUserFcmToken:error', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // Wait for Firebase to restore the native auth session before starting
    // the Firestore listener. Redux persist may rehydrate session before
    // Firebase auth is ready, which causes permission-denied errors.
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[RootNavigator] onAuthStateChanged', {
        uid: firebaseUser?.uid ?? null,
        email: firebaseUser?.email ?? null,
      });

      // Clean up any previous ride listener
      unsubscribeRideRef.current?.();
      unsubscribeRideRef.current = null;
      unsubscribeTokenRefreshRef.current?.();
      unsubscribeTokenRefreshRef.current = null;
      if (firebaseUser) {
        await store.dispatch(restoreSession());
        await syncFcmToken();

        console.log('[RootNavigator] Firebase auth ready, uid:', firebaseUser.uid);

        unsubscribeRideRef.current = listenToActivePassengerRide(
          firebaseUser.uid,
          (ride) => {
            console.log('updated ride data from firestore:', ride);
            store.dispatch(setRide(ride));
            store.dispatch(
              updatePassengerRideState({
                rideStatus: ride?.status as any ?? 'idle',
                activeRideId: ride?.id ?? null,
              }),
            );
          },
          (error) => {
            console.error('[rideListener] error:', error);
          },
        );

        unsubscribeTokenRefreshRef.current = messaging().onTokenRefresh((token) => {
          void syncFcmToken(token);
        });
      } else {
        console.log('[RootNavigator] Firebase auth: no user signed in');
        store.dispatch(clearSessionState());
        store.dispatch(setRide(null));
        store.dispatch(
          updatePassengerRideState({
            rideStatus: 'idle',
            activeRideId: null,
          }),
        );
      }

      setAuthReady(true);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRideRef.current?.();
      unsubscribeRideRef.current = null;
      unsubscribeTokenRefreshRef.current?.();
      unsubscribeTokenRefreshRef.current = null;
    };
  }, []);

  if (!authReady) {
    return <SplashScreen />;
  }

  const isDriverSession = session?.user.role === 'driver';

  if (session) {
    return (
      <>
        <HomeScreen />
        {isDriverSession ? <DriverRideRequestSheetHost /> : null}
      </>
    );
  }

  return <AuthScreen />;
}

function App() {
  useEffect(() => {
    const requestAndroidLocationPermission = async () => {
      if (Platform.OS !== 'android') {
        return;
      }

      const permissions = [
        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ];

      const currentStatuses = await checkMultiple(permissions);
      const hasLocationPermission = permissions.some(
        (permission) => currentStatuses[permission] === RESULTS.GRANTED,
      );

      if (hasLocationPermission) {
        return;
      }

      const requestedStatuses = await requestMultiple(permissions);
      const grantedAfterRequest = permissions.some(
        (permission) => requestedStatuses[permission] === RESULTS.GRANTED,
      );

      if (!grantedAfterRequest) {
        const isBlocked = permissions.some(
          (permission) => requestedStatuses[permission] === RESULTS.BLOCKED,
        );

        if (isBlocked) {
          Alert.alert(
            'Location permission required',
            'Enable location permission in settings to use map location features.',
            [
              { text: 'Not now', style: 'cancel' },
              {
                text: 'Open settings',
                onPress: () => {
                  openSettings().catch(() => undefined);
                },
              },
            ],
          );
        }
      }
    };

    requestAndroidLocationPermission().catch(() => undefined);
  }, []);

  return (
    <Provider store={store}>
      <PersistGate
        persistor={persistor}
        loading={<SplashScreen />}
        onBeforeLift={() => {
          store.dispatch(hydrateAuthStatus());
        }}
      >
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
