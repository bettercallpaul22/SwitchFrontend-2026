import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ZodError } from 'zod';
import * as authService from '../services/authService';
import {
  AuthSession,
  DriverProfileUpdatePayload,
  LoginPayload,
  LoginResponseData,
  PassengerRideStatus,
  RegisterPayloadByRole,
  UserRole
} from '../types/auth';
import { RideStatus } from '../types/ride';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export type AuthState = {
  status: AuthStatus;
  activeRole: UserRole;
  session: AuthSession | null;
  error: string | null;
};

const initialState: AuthState = {
  status: 'unauthenticated',
  activeRole: 'passenger',
  session: null,
  error: null
};

type StructuredValidationIssue = {
  path?: unknown;
  message?: unknown;
};

const formatValidationIssue = (issue: StructuredValidationIssue): string | null => {
  if (typeof issue.message !== 'string' || issue.message.trim().length === 0) {
    return null;
  }

  if (!Array.isArray(issue.path) || issue.path.length === 0) {
    return issue.message.trim();
  }

  const safePath = issue.path
    .filter((segment) => typeof segment === 'string' || typeof segment === 'number')
    .map((segment) => String(segment))
    .join('.');

  if (!safePath) {
    return issue.message.trim();
  }

  return `${safePath}: ${issue.message.trim()}`;
};

const tryParseStructuredErrorMessage = (message: string): string | null => {
  const trimmed = message.trim();
  if (!trimmed || (!trimmed.startsWith('[') && !trimmed.startsWith('{'))) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (Array.isArray(parsed) && parsed.length > 0) {
      const firstIssue = parsed[0] as StructuredValidationIssue;
      return formatValidationIssue(firstIssue);
    }

    if (parsed && typeof parsed === 'object') {
      const withMessage = parsed as { message?: unknown };
      if (typeof withMessage.message === 'string' && withMessage.message.trim().length > 0) {
        return withMessage.message.trim();
      }
    }
  } catch {
    return null;
  }

  return null;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof ZodError && error.issues.length > 0) {
    const firstIssue = error.issues[0];
    return formatValidationIssue({
      path: firstIssue.path,
      message: firstIssue.message
    }) ?? 'Validation failed. Please check your details and try again.';
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return tryParseStructuredErrorMessage(error.message) ?? error.message;
  }

  if (typeof error === 'string') {
    return tryParseStructuredErrorMessage(error) ?? error;
  }

  return 'Something went wrong. Please try again.';
};

const getAuthCodeFromMessage = (message: string): string | null => {
  const match = message.match(/\[(auth\/[a-z-]+)\]/i);
  return match?.[1]?.toLowerCase() ?? null;
};

const toLoginErrorMessage = (error: unknown): string => {
  const fallbackMessage = 'Unable to login right now. Please try again.';

  if (error instanceof Error && error.message.trim().length > 0) {
    const code = getAuthCodeFromMessage(error.message);

    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return toErrorMessage(error) || fallbackMessage;
    }
  }

  if (typeof error === 'string') {
    const code = getAuthCodeFromMessage(error);
    if (
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-email'
    ) {
      return 'Invalid email or password';
    }
  }

  return toErrorMessage(error) || fallbackMessage;
};

type RegisterAndLoginInput =
  | { role: 'passenger'; payload: RegisterPayloadByRole['passenger'] }
  | { role: 'driver'; payload: RegisterPayloadByRole['driver'] };

const normalizePassengerRideStatus = (rideStatus: string | null | undefined): PassengerRideStatus => {
  if (!rideStatus) return 'idle';

  switch (rideStatus.trim().toLowerCase()) {
    case 'requested':
    case 'requesting':
    case 'searching_driver':
      return 'requested';
    case 'accepted':
      return 'accepted';
    case 'arrived':
      return 'arrived';
    case 'on_trip':
    case 'on_ride':
      return 'on_trip';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'idle';
  }
};

const normalizeUser = (user: LoginResponseData['user'] | AuthSession['user']): AuthSession['user'] => {
  if (user.role !== 'driver') {
    return {
      ...user,
      rideStatus: normalizePassengerRideStatus(user.rideStatus),
      activeRideId: user.activeRideId ?? null
    };
  }

  return {
    ...user,
    basicProfile: user.basicProfile ?? null,
    vehicleDetails: user.vehicleDetails ?? null,
    preference: user.preference ?? null,
    ratingAverage: user.ratingAverage ?? 0,
    ratingCount: user.ratingCount ?? 0,
    completedTrips: user.completedTrips ?? 0
  };
};

// Convert authService ride status to the app's PassengerRideStatus type
const convertRideStatus = (status: string): PassengerRideStatus => {
  // The authService uses a broader set of statuses from the backend
  // Normalize them to the app's canonical types
  const normalized = normalizePassengerRideStatus(status);
  // Now convert to the app's RideStatus or 'idle'
  if (normalized === 'idle') return 'idle';
  return normalized as RideStatus;
};

// Convert authService user document to the app's AuthApiUser type
const convertToAuthApiUser = (user: authService.PassengerUserDocument | authService.DriverUserDocument): LoginResponseData['user'] => {
  if (user.role === 'passenger') {
    return {
      id: user.id,
      role: 'passenger',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      fcmToken: user.fcmToken,
      lastKnownLocation: user.lastKnownLocation,
      lastLocationUpdatedAt: user.lastLocationUpdatedAt,
      termsAccepted: user.termsAccepted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      dateOfBirth: user.dateOfBirth,
      walletBalance: user.walletBalance,
      switchCoinBalance: user.switchCoinBalance,
      rideStatus: convertRideStatus(user.rideStatus),
      activeRideId: user.activeRideId
    };
  } else {
    return {
      id: user.id,
      role: 'driver',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      fcmToken: user.fcmToken,
      lastKnownLocation: user.lastKnownLocation,
      lastLocationUpdatedAt: user.lastLocationUpdatedAt,
      termsAccepted: user.termsAccepted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      basicProfile: user.basicProfile,
      vehicleDetails: user.vehicleDetails,
      preference: user.preference,
      ratingAverage: user.ratingAverage ?? 0,
      ratingCount: user.ratingCount ?? 0,
      completedTrips: user.completedTrips ?? 0
    };
  }
};

const buildSession = (input: {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: authService.PassengerUserDocument | authService.DriverUserDocument;
}) => {
  const expiresInSeconds = Number(input.expiresIn);
  const safeDurationInSeconds = Number.isFinite(expiresInSeconds)
    ? Math.max(expiresInSeconds, 60)
    : 3600;

  return {
    token: input.token,
    refreshToken: input.refreshToken,
    expiresAt: Date.now() + safeDurationInSeconds * 1000,
    user: normalizeUser(convertToAuthApiUser(input.user))
  } satisfies AuthSession;
};

export const login = createAsyncThunk<AuthSession, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      // Use the new authService which handles validation, Firebase auth, and Firestore
      const loginResult = await authService.loginUser(payload);

      return buildSession(loginResult);
    } catch (error) {
      return rejectWithValue(toLoginErrorMessage(error));
    }
  }
);

export const registerAndLogin = createAsyncThunk<
  AuthSession,
  RegisterAndLoginInput,
  { rejectValue: string }
>('auth/registerAndLogin', async ({ role, payload }, { rejectWithValue }) => {
  try {
    console.log('[authSlice] registerAndLogin:req', {
      role,
      email: payload.email
    });

    // Use the new authService for registration
    if (role === 'passenger') {
      await authService.registerPassenger(payload);
    } else {
      await authService.registerDriver(payload);
    }

    console.log('[authSlice] registerAndLogin:registration-success', {
      role,
      email: payload.email
    });

    // After successful registration, log in the user
    const loginResult = await authService.loginUser({
      email: payload.email,
      password: payload.password
    });

    console.log('[authSlice] registerAndLogin:login-success', {
      role,
      email: payload.email,
      userId: loginResult.user.id,
      userRole: loginResult.user.role
    });

    return buildSession(loginResult);
  } catch (error) {
    console.log('[authSlice] registerAndLogin:error', {
      role,
      email: payload.email,
      message: toErrorMessage(error)
    });
    return rejectWithValue(toErrorMessage(error));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  // Use the new authService which calls auth().signOut()
  await authService.logoutUser().catch(() => undefined);
  return undefined;
});

export const restoreSession = createAsyncThunk<AuthSession | null, void, { rejectValue: string }>(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const loginResult = await authService.restoreSessionUser();

      if (!loginResult) {
        return null;
      }

      return buildSession(loginResult);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const updateDriverProfile = createAsyncThunk<
  AuthSession['user'],
  DriverProfileUpdatePayload,
  { state: { auth: AuthState }; rejectValue: string }
>('auth/updateDriverProfile', async (payload, { getState, rejectWithValue }) => {
  try {
    const session = getState().auth.session;

    if (!session || session.user.role !== 'driver') {
      return rejectWithValue('Only an authenticated driver can update profile data');
    }

    const updatedUser = await authService.updateDriverProfile(session.user.id, payload);
    return normalizeUser(updatedUser);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setActiveRole: (state, action: PayloadAction<UserRole>) => {
      state.activeRole = action.payload;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    clearSessionState: (state) => {
      state.status = 'unauthenticated';
      state.session = null;
      state.error = null;
    },
    hydrateAuthStatus: (state) => {
      state.status = state.session ? 'authenticated' : 'unauthenticated';
      state.error = null;
    },
    updatePassengerRideState: (
      state,
      action: PayloadAction<{ rideStatus: PassengerRideStatus; activeRideId: string | null }>
    ) => {
      if (!state.session || state.session.user.role !== 'passenger') {
        return;
      }

      state.session.user.rideStatus = action.payload.rideStatus;
      state.session.user.activeRideId = action.payload.activeRideId;
    },
    updateSessionFcmToken: (
      state,
      action: PayloadAction<{ fcmToken: string; updatedAt: string }>
    ) => {
      if (!state.session) {
        return;
      }

      state.session.user.fcmToken = action.payload.fcmToken;
      state.session.user.updatedAt = action.payload.updatedAt;
    },
    updateDriverSessionLocation: (
      state,
      action: PayloadAction<{ lat: number; lng: number; updatedAt: string }>
    ) => {
      if (!state.session || state.session.user.role !== 'driver') {
        return;
      }

      state.session.user.lastKnownLocation = {
        lat: action.payload.lat,
        lng: action.payload.lng
      };
      state.session.user.lastLocationUpdatedAt = action.payload.updatedAt;
      state.session.user.updatedAt = action.payload.updatedAt;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.session = action.payload;
        state.activeRole = action.payload.user.role;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        console.log('[authSlice] login.rejected', {
          payload: action.payload ?? null,
          errorMessage: action.error.message ?? null
        });
        state.status = 'unauthenticated';
        state.session = null;
        state.error = action.payload ?? action.error.message ?? 'Login failed';
      })
      .addCase(restoreSession.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.status = 'authenticated';
          state.session = action.payload;
          state.activeRole = action.payload.user.role;
        } else {
          state.status = 'unauthenticated';
          state.session = null;
        }
        state.error = null;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.session = null;
        state.error = action.payload ?? action.error.message ?? 'Unable to restore session';
      })
      .addCase(registerAndLogin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerAndLogin.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.session = action.payload;
        state.activeRole = action.payload.user.role;
        state.error = null;
      })
      .addCase(registerAndLogin.rejected, (state, action) => {
        console.log('[authSlice] registerAndLogin.rejected', {
          payload: action.payload ?? null,
          errorMessage: action.error.message ?? null
        });
        state.status = 'unauthenticated';
        state.session = null;
        state.error = action.payload ?? action.error.message ?? 'Registration failed';
      })
      .addCase(updateDriverProfile.pending, (state) => {
        state.error = null;
      })
      .addCase(updateDriverProfile.fulfilled, (state, action) => {
        if (state.session) {
          state.session.user = action.payload;
        }
        state.error = null;
      })
      .addCase(updateDriverProfile.rejected, (state, action) => {
        state.error = action.payload ?? action.error.message ?? 'Unable to update driver profile';
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.session = null;
        state.error = null;
      });
  }
});

export const {
  setActiveRole,
  clearAuthError,
  clearSessionState,
  hydrateAuthStatus,
  updatePassengerRideState,
  updateSessionFcmToken,
  updateDriverSessionLocation
} = authSlice.actions;
export const authReducer = authSlice.reducer;
