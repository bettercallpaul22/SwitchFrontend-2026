# Authentication Service Documentation

## Overview

The authentication system has been refactored to use Firebase directly on the client side, eliminating the need for backend API calls. This document explains the architecture, flow, and implementation details.

## Architecture

### Components

1. **`authService.ts`** - Pure TypeScript service layer
   - Handles all Firebase authentication operations
   - Validates inputs using Zod schemas (identical to backend)
   - Manages Firestore user documents
   - Provides typed error handling

2. **`authSlice.ts`** - Redux state management
   - Calls authService functions (no direct Firebase calls)
   - Maintains authentication state
   - Handles session management
   - Preserves all existing Redux patterns

3. **Firebase SDKs**
   - `@react-native-firebase/auth` - Authentication
   - `@react-native-firebase/firestore` - User data storage

## Authentication Flow

### Registration Flow

```
User Registration Request
    ↓
authSlice.registerAndLogin()
    ↓
authService.registerPassenger() or authService.registerDriver()
    ↓
1. Validate input with Zod schema
    ├─ If invalid → throw ServiceError(BAD_REQUEST)
    ↓
2. Check if email already exists
    ├─ If exists → throw ServiceError(CONFLICT)
    ↓
3. Create Firebase Auth user
    ├─ createUserWithEmailAndPassword()
    ├─ If fails → throw ServiceError (mapped from Firebase error)
    ↓
4. Create user document in Firestore
    ├─ users/{uid} with complete user profile
    ├─ If fails → delete auth user, throw ServiceError
    ↓
5. Return user document
    ↓
authService.loginUser()
    ↓
1. Validate login input with Zod schema
    ↓
2. Sign in with Firebase Auth
    ├─ signInWithEmailAndPassword()
    ↓
3. Get Firebase ID token
    ↓
4. Fetch user document from Firestore
    ↓
5. Return { token, refreshToken, expiresIn, user }
    ↓
authSlice.buildSession()
    ↓
1. Normalize user data
    ↓
2. Calculate expiration time
    ↓
3. Create AuthSession
    ↓
Redux state updated with session
```

### Login Flow

```
User Login Request
    ↓
authSlice.login()
    ↓
authService.loginUser()
    ↓
1. Validate input with Zod schema
    ├─ If invalid → throw ServiceError(BAD_REQUEST)
    ↓
2. Sign in with Firebase Auth
    ├─ signInWithEmailAndPassword()
    ├─ If fails → throw ServiceError (mapped from Firebase error)
    ↓
3. Get Firebase ID token
    ↓
4. Fetch user document from Firestore
    ├─ users/{uid}
    ├─ If not found → throw ServiceError(NOT_FOUND)
    ↓
5. Return { token, refreshToken, expiresIn, user }
    ↓
authSlice.buildSession()
    ↓
1. Normalize user data
    ↓
2. Calculate expiration time
    ↓
3. Create AuthSession
    ↓
Redux state updated with session
```

### Logout Flow

```
User Logout Request
    ↓
authSlice.logout()
    ↓
authService.logoutUser()
    ↓
1. Call auth().signOut()
    ├─ If fails → throw ServiceError (mapped from Firebase error)
    ↓
Redux state cleared (session = null)
```

## Input Validation

All inputs are validated using Zod schemas that are **identical** to the backend schemas:

### Passenger Registration Schema
```typescript
{
  firstName: string (1-50 chars)
  lastName: string (1-50 chars)
  email: string (valid email, lowercased)
  phone: string (E.164 format: +[1-9]\d{7,14})
  password: string (8-128 chars, must include uppercase, lowercase, number, special char)
  termsAccepted: true (must be exactly true)
  dateOfBirth?: string (valid ISO date string, optional)
}
```

### Driver Registration Schema
```typescript
{
  // Base fields (same as passenger)
  firstName: string (1-50 chars)
  lastName: string (1-50 chars)
  email: string (valid email, lowercased)
  phone: string (E.164 format: +[1-9]\d{7,14})
  password: string (8-128 chars, must include uppercase, lowercase, number, special char)
  termsAccepted: true (must be exactly true)
  
  // Driver-specific fields (optional)
  basicProfile?: {
    idNumber: string
    driverLicenseUrl: string (valid URL)
    profilePhotoUrl: string (valid URL)
    ninSlipUrl: string (valid URL)
  }
  vehicleDetails?: {
    make: string
    model: string
    color: string
    plateNumber: string
  }
  preference?: {
    earningPreference: 'one_time_payment_daily' | 'commission_based' | 'subscription'
  }
}
```

### Login Schema
```typescript
{
  email: string (valid email, lowercased)
  password: string (min 1 char)
}
```

## Error Handling

The service maps Firebase errors to typed `ServiceError` objects with HTTP-like status codes:

### Validation Errors
- **Status**: 400
- **Code**: `BAD_REQUEST`
- **Examples**: Invalid email, weak password, missing required fields

### Authentication Errors
- **Status**: 401
- **Code**: `UNAUTHORIZED`
- **Examples**: Invalid email/password, account disabled

### Conflict Errors
- **Status**: 409
- **Code**: `CONFLICT`
- **Examples**: Email already in use

### Not Found Errors
- **Status**: 404
- **Code**: `NOT_FOUND`
- **Examples**: User profile not found

### Rate Limiting
- **Status**: 429
- **Code**: `BAD_REQUEST`
- **Examples**: Too many login attempts

### Internal Errors
- **Status**: 500
- **Code**: `INTERNAL_ERROR`
- **Examples**: Network errors, Firebase service unavailable

## Firestore Data Structure

### Passenger User Document
```typescript
{
  id: string (Firebase Auth UID)
  role: 'passenger'
  firstName: string
  lastName: string
  email: string (lowercase)
  phone: string (E.164 format)
  termsAccepted: true
  dateOfBirth?: string (ISO date)
  rideStatus: 'idle' | 'requested' | 'accepted' | 'arrived' | 'on_trip' | 'completed' | 'cancelled'
  activeRideId: string | null
  createdAt: string (ISO date)
  updatedAt: string (ISO date)
}
```

### Driver User Document
```typescript
{
  id: string (Firebase Auth UID)
  role: 'driver'
  firstName: string
  lastName: string
  email: string (lowercase)
  phone: string (E.164 format)
  termsAccepted: true
  basicProfile?: {
    idNumber: string
    driverLicenseUrl: string
    profilePhotoUrl: string
    ninSlipUrl: string
  }
  vehicleDetails?: {
    make: string
    model: string
    color: string
    plateNumber: string
  }
  preference?: {
    earningPreference: 'one_time_payment_daily' | 'commission_based' | 'subscription'
  }
  createdAt: string (ISO date)
  updatedAt: string (ISO date)
}
```

## Session Management

### AuthSession Structure
```typescript
{
  token: string (Firebase ID token)
  refreshToken: string (Firebase refresh token)
  expiresAt: number (Unix timestamp in milliseconds)
  user: {
    // Normalized user data
    // For passengers:
    id: string
    role: 'passenger'
    firstName: string
    lastName: string
    email: string
    phone: string
    termsAccepted: true
    dateOfBirth?: string
    rideStatus: PassengerRideStatus
    activeRideId: string | null
    createdAt: string
    updatedAt: string
    
    // For drivers:
    id: string
    role: 'driver'
    firstName: string
    lastName: string
    email: string
    phone: string
    termsAccepted: true
    basicProfile: BasicProfile | null
    vehicleDetails: VehicleDetails | null
    preference: DriverPreference | null
    createdAt: string
    updatedAt: string
  }
}
```

### Token Expiration
- Default expiration: 1 hour (3600 seconds)
- Minimum expiration: 60 seconds
- Calculated from Firebase ID token result
- Stored as Unix timestamp in milliseconds

## Usage Examples

### Login
```typescript
import { login } from '../store/authSlice';

dispatch(login({
  email: 'user@example.com',
  password: 'SecurePassword123!'
}));
```

### Passenger Home Screen Usage
```typescript
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { usePassengerHomeState } from '../features/passenger/hooks/usePassengerHomeState';

export function PassengerHomeScreen() {
  const dispatch = useAppDispatch();
  const { session, onLogout } = usePassengerHomeState();
  const { status, error } = useAppSelector((state) => state.ride);

  // Session data is available through Redux store
  if (!session || session.user.role !== 'passenger') {
    return null; // Redirect to auth screen
  }

  // Log session data when finding driver
  useEffect(() => {
    if (screen === 'finding' && !hasLoggedFindingScreen.current) {
      console.log('FIND_DRIVER_RIDE_DATA', rideData);
      console.log('FIND_DRIVER_RIDER_PROFILE_FULL', session.user);
      hasLoggedFindingScreen.current = true;
    }
  }, [rideData, screen, session.user]);

  // Logout functionality
  const onLogout = () => {
    dispatch(logout());
  };
}
```
### Register Passenger
```typescript
import { registerAndLogin } from '../store/authSlice';

dispatch(registerAndLogin({
  role: 'passenger',
  payload: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    password: 'SecurePassword123!',
    termsAccepted: true,
    dateOfBirth: '1990-01-01'
  }
}));
```

### Register Driver
```typescript
import { registerAndLogin } from '../store/authSlice';

dispatch(registerAndLogin({
  role: 'driver',
  payload: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+1234567890',
    password: 'SecurePassword123!',
    termsAccepted: true,
    basicProfile: {
      idNumber: '123456789',
      driverLicenseUrl: 'https://example.com/license.jpg',
      profilePhotoUrl: 'https://example.com/photo.jpg',
      ninSlipUrl: 'https://example.com/nin.jpg'
    },
    vehicleDetails: {
      make: 'Toyota',
      model: 'Camry',
      color: 'Blue',
      plateNumber: 'ABC123'
    },
    preference: {
      earningPreference: 'commission_based'
    }
  }
}));
```

### Logout
```typescript
import { logout } from '../store/authSlice';

dispatch(logout());
```

## Key Differences from Previous Implementation

### Before (API-based)
```
App → authSlice → API calls → Backend → Firebase Admin SDK → Firebase
```

### Current Implementation in PassengerHomeScreen
- **Session Management**: Uses Redux store for session state
- **Authentication Check**: Verifies `session.user.role === 'passenger'` before rendering
- **Data Logging**: Logs ride data and full user profile when finding driver
- **Logout Integration**: Uses Redux `logout()` action for session cleanup
- **State Synchronization**: Uses `usePassengerHomeState()` hook for authentication state
### After (Direct Firebase)
```
App → authSlice → authService → Firebase SDK → Firebase
```

### Benefits
1. **No backend dependency** - Authentication works entirely client-side
2. **Faster response times** - Direct Firebase calls, no API layer
3. **Reduced complexity** - Fewer moving parts
4. **Offline capability** - Firebase SDK handles offline scenarios
5. **Consistent validation** - Same Zod schemas as backend

## Important Notes

1. **No HTTP calls** - The service uses Firebase SDKs directly, no fetch or axios
2. **Validation first** - All inputs are validated before any Firebase operations
3. **Error consistency** - Error messages and codes match the backend exactly
4. **Type safety** - Full TypeScript support with proper type inference
5. **Redux compatibility** - All existing Redux patterns and state shape preserved
6. **Cleanup on failure** - If Firestore write fails after auth user creation, the auth user is deleted

## Testing Considerations

When testing the authentication flow:

1. **Mock Firebase** - Use `@react-native-firebase/auth` and `@react-native-firebase/firestore` mocks
2. **Test validation** - Verify Zod schemas reject invalid inputs
3. **Test error mapping** - Ensure Firebase errors are correctly mapped to ServiceErrors
4. **Test success paths** - Verify successful registration and login flows
5. **Test cleanup** - Ensure auth users are cleaned up if Firestore writes fail

## Troubleshooting

### Common Issues

1. **"Zod is not installed"**
   - Run: `npm install zod`

### Passenger Home Screen Issues

1. **"Session not available" errors**
   - Ensure user is authenticated before accessing PassengerHomeScreen
   - Check Redux store for session state
   - Verify `session.user.role === 'passenger'` condition

2. **"Console logging not working"**
   - Check if `screen === 'finding'` condition is met
   - Verify `hasLoggedFindingScreen.current` flag logic
   - Ensure `rideData` and `session.user` are properly populated

3. **"Logout not working"**
   - Verify Redux `logout()` action is dispatched correctly
   - Check if session state is properly cleared in Redux store
   - Ensure navigation redirects to AuthScreen after logout
2. **"Module not found: @react-native-firebase/auth"**
   - Ensure Firebase is properly configured in your React Native project

3. **"Invalid credential" errors**
   - Check Firebase configuration in `firebase.json` and Google Services files

4. **"Permission denied" errors**
   - Verify Firestore security rules allow read/write to the `users` collection

5. **"Network error" errors**
   - Check internet connectivity and Firebase project configuration