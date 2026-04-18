# Integration Guide - Multi Sheet Bottom Sheet System

## Quick Start

### 1. Update App.tsx

Replace the old `DriverRideRequestSheetHost` with the new `DriverRideSheetHost`:

```typescript
// OLD (before)
import { DriverRideRequestSheetHost } from './src/components/bottomsheets';

function RootNavigator() {
  const isDriverSession = session?.user.role === 'driver';

  if (session) {
    return (
      <>
        <HomeScreen />
        {isDriverSession ? <DriverRideRequestSheetHost /> : null}
      </>
    );
  }
}

// NEW (after)
import { DriverRideSheetHost } from './src/components/bottomsheets';

function RootNavigator() {
  const isDriverSession = session?.user.role === 'driver';

  if (session) {
    return (
      <>
        <HomeScreen />
        {isDriverSession && <DriverRideSheetHost />}
      </>
    );
  }
}
```

### 2. Files Created/Modified

**New Components:**
- `src/components/bottomsheets/RideAcceptedSheet.tsx` - Ride accepted, heading to pickup
- `src/components/bottomsheets/RideOnTripSheet.tsx` - Active trip with passenger
- `src/components/bottomsheets/RideArrivedSheet.tsx` - Driver arrived at pickup/destination
- `src/components/bottomsheets/RideCompletedSheet.tsx` - Trip finished, show summary
- `src/components/bottomsheets/DriverRideSheetHost.tsx` - Main orchestrator component

**Updated State Management:**
- `src/store/driverCurrentRideSlice.ts` (NEW) - Redux slice for active ride data
- `src/store/index.ts` - Added driverCurrentRideReducer

**Updated Exports:**
- `src/components/bottomsheets/index.ts` - Exports all new sheets

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   DriverRideSheetHost                  │
│                  (Smart Orchestrator)                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Redux state: driverCurrentRide                       │
│  - currentRide: DriverCurrentRide | null              │
│  - isLoading: boolean                                 │
│  - error: string | null                               │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Renders appropriate sheet based on ride status:      │
│                                                        │
│  requested → RideRequestSheet (existing)              │
│  ↓                                                     │
│  accepted → RideAcceptedSheet                         │
│  ↓                                                     │
│  on_trip → RideOnTripSheet                            │
│  ↓                                                     │
│  arrived → RideArrivedSheet                           │
│  ↓                                                     │
│  completed → RideCompletedSheet                       │
│  ↓                                                     │
│  null → Hide all sheets                               │
└────────────────────────────────────────────────────────┘
```

## State Management

### Dispatch Actions

```typescript
import { useAppDispatch } from '../store/hooks';
import {
  setCurrentRide,
  updateRideStatus,
  updateRideEstimates,
  updateCurrentRide,
  clearCurrentRide,
  setLoading,
  setError,
} from '../store/driverCurrentRideSlice';

const dispatch = useAppDispatch();

// Set a new ride
dispatch(setCurrentRide({
  id: 'ride-123',
  status: 'accepted',
  passengerId: 'passenger-xyz',
  passengerName: 'John Doe',
  pickupAddress: '123 Main St',
  destinationAddress: '456 Oak Ave',
  paymentMethod: 'Credit Card',
  estimatedPickupTime: '5 mins',
}));

// Update ride status
dispatch(updateRideStatus('on_trip'));

// Update ETA/distance
dispatch(updateRideEstimates({
  estimatedTimeRemaining: '8 mins',
  estimatedDistance: '2.5 km',
}));

// Partial update
dispatch(updateCurrentRide({
  tripDuration: '15 mins',
  tripDistance: '8.5 km',
  fare: 250.0,
}));

// Dismiss/clear
dispatch(clearCurrentRide());
```

### Type Definition

```typescript
export type DriverCurrentRide = {
  id: string;
  status: RideStatus; // 'requested' | 'accepted' | 'on_trip' | 'arrived' | 'completed' | 'cancelled'
  passengerId: string;
  passengerName: string;
  passengerPhone?: string;
  pickupAddress: string;
  destinationAddress: string;
  paymentMethod?: string;
  estimatedPickupTime?: string; // For 'accepted'
  estimatedTimeRemaining?: string; // For 'on_trip'
  estimatedDistance?: string; // For 'on_trip'
  tripDuration?: string; // For 'completed'
  tripDistance?: string; // For 'completed'
  fare?: number; // For 'completed'
  currency?: string; // For 'completed'
};
```

## API Integration Points

Update the callback handlers in `DriverRideSheetHost.tsx` (search for `TODO: Call API`):

### 1. Accept Ride Request
```typescript
handleRideRequestAccept = async (request: DriverRideRequest) => {
  // POST /api/rides/{rideId}/accept
  // Expected response: Full ride data with 'accepted' status
}
```

### 2. Start Trip
```typescript
handleStartTrip = async () => {
  // POST /api/rides/{currentRide.id}/start
  // Updates status to 'on_trip'
}
```

### 3. Mark Arrived
```typescript
handleArrived = async () => {
  // POST /api/rides/{currentRide.id}/arrived
  // Updates status to 'arrived'
}
```

### 4. Confirm Arrival
```typescript
handleConfirmArrival = async () => {
  // POST /api/rides/{currentRide.id}/confirm-arrival
  // Updates status to 'completed'
}
```

### 5. Complete Ride
```typescript
handleCompleteRide = async () => {
  // POST /api/rides/{currentRide.id}/complete
  // Marks ride as done, clears current ride
}
```

## FCM Message Handling

When receiving ride requests via Firebase Cloud Messaging, dispatch to Redux:

```typescript
import { setCurrentRide } from '../store/driverCurrentRideSlice';

// In FCM message handler
messaging().onMessage(async (message) => {
  if (message.data?.type === 'RIDE_REQUEST') {
    const rideRequest = parseRideRequest(message.data);
    
    dispatch(setCurrentRide({
      id: rideRequest.rideId,
      status: 'requested',
      passengerId: rideRequest.passengerId,
      passengerName: rideRequest.passengerName,
      pickupAddress: rideRequest.pickupAddress,
      destinationAddress: rideRequest.destinationAddress,
      paymentMethod: rideRequest.paymentMethod,
    }));
  }
});
```

## Sheet Customization

Each sheet can be customized by editing:
- Colors: Change theme colors in style sheets
- Text: Update labels and messages
- Layout: Adjust padding and margins
- Icons: Replace lucide-react-native icons

## Testing Checklist

- [ ] App compiles without errors
- [ ] RideRequestSheet still works for incoming requests
- [ ] Accepting ride transitions to RideAcceptedSheet
- [ ] Clicking "Start Trip" shows RideOnTripSheet
- [ ] ETA / distance update in real-time
- [ ] Clicking "Arrived" shows RideArrivedSheet
- [ ] Confirming arrival shows RideCompletedSheet
- [ ] Trip summary displays correctly
- [ ] Closing sheet clears all data
- [ ] Re-requesting a ride resets sheets
- [ ] Back button doesn't break sheet state

## Troubleshooting

### Sheet not showing
1. Verify Redux state has `driverCurrentRide` reducer
2. Check `DriverRideSheetHost` is mounted in App.tsx
3. Verify ride status matches an expected value

### Colors not matching
1. Check theme/colors.ts exports `appColors`
2. Verify all `COLORS` changed to `appColors`
3. Check color values in appColors object

### Animations not working
1. Verify `BaseBottomSheet` is properly imported
2. Check Modal visibility state in Redux
3. Test on device (not just emulator)

## Future Enhancements

See [README.md](./README.md) in bottomsheets folder for future enhancement ideas.
