# Incoming Ride Request Flow (Driver Frontend)

This guide explains how the driver app receives an incoming ride request, what the UI does, what happens on Accept/Skip/Expire, and which Firestore documents are updated.

## Scope

- Frontend-only flow in `SwitchApp`
- Driver-facing incoming ride request bottom sheet
- Firestore writes currently done from frontend

## High-Level Flow

1. Backend sends FCM data message with `type = ride_request`.
2. App receives the message in a global host component.
3. Host parses payload and stores request in Redux.
4. `RideRequestSheet` appears over any driver screen.
5. Driver can:
   - Accept
   - Skip
   - Do nothing until countdown expires
6. App writes response to Firestore (`ride_offers` and `driver_locations`), then dismisses sheet.

## Where It Is Mounted Globally

`DriverRideRequestSheetHost` is mounted at app root for driver sessions:

- `App.tsx` -> `RootNavigator`
- File: `src/components/bottomsheets/DriverRideRequestSheetHost.tsx`

Because it is rendered beside `HomeScreen`, it can show on top of any driver screen.

## Payload Expected From FCM

The host parses `message.data` and expects:

- `type` (must be `ride_request`)
- `offerId`
- `rideId`
- `passengerId`
- `pickupAddress`
- `destinationAddress`
- `paymentMethod`
- optional `requestedAt`
- optional `expiresAt`

If `requestedAt`/`expiresAt` are missing, defaults are used (`expiresAt` defaults to now + 20s).

Parsing function:

- `parseDriverRideRequestFromMessage` in `src/components/bottomsheets/DriverRideRequestSheetHost.tsx`

## UI Behavior

Bottom sheet component:

- `src/components/bottomsheets/RideRequestSheet.tsx`

Displayed data:

- Pickup address
- Destination address
- Payment method
- Countdown timer

Actions:

- `Accept` button
- `Skip` button
- Automatic `Expired` action when timer reaches zero

## Redux State

Slice:

- `src/store/driverRideRequestSlice.ts`

State:

- `currentRequest: DriverRideRequest | null`

Actions:

- `setCurrentDriverRideRequest`
- `dismissCurrentDriverRideRequest`
- `resetDriverRideRequestState`

Type:

- `src/types/driverRideRequest.ts`

## Firestore Writes On Driver Response

Service:

- `src/services/driverRideRequestService.ts`

Main function:

- `respondToDriverRideRequest({ driverId, request, status })`

### Common Validation (transaction)

Inside transaction, app verifies:

- `ride_offers/{offerId}` exists
- `driverId` and `rideId` match request
- offer status is still `pending`

### Accept Path

If status is `accepted`, transaction updates:

1. `ride_offers/{offerId}`
   - `status = accepted`
   - `respondedAt = now`
   - `updatedAt = now`
2. `driver_locations/{driverId}`
   - `isAvailable = false`
   - `activeRideId = rideId`
   - `updatedAt = now`

### Skip Path

If status is `skipped`, transaction updates:

1. `ride_offers/{offerId}`
   - `status = skipped`
   - `respondedAt = now`
   - `updatedAt = now`
2. `driver_locations/{driverId}`
   - `activeRideId = null`
   - `updatedAt = now`

### Expire Path

If countdown ends, host submits `expired` using the same transaction logic:

1. `ride_offers/{offerId}`
   - `status = expired`
   - `respondedAt = now`
   - `updatedAt = now`
2. `driver_locations/{driverId}`
   - `activeRideId = null`
   - `updatedAt = now`

### Fallback Clear

If offer cannot be updated (missing/mismatch/non-pending), host calls:

- `clearDriverPendingRideRequest(driverId, request)`

This currently clears only:

- `driver_locations/{driverId}.activeRideId = null`
- `updatedAt = now`

## Function Map (Frontend)

### Message Intake

- `DriverRideRequestSheetHost`:
  - `messaging().onMessage(...)`
  - `messaging().onNotificationOpenedApp(...)`
  - `messaging().getInitialNotification()`

### Parse + State

- `parseDriverRideRequestFromMessage`
- `setCurrentDriverRideRequest`
- `dismissCurrentDriverRideRequest`

### Sheet UI

- `RideRequestSheet`:
  - local timer via `setInterval`
  - calls `onAccept`, `onSkip`, `onExpired`

### Firestore Mutation

- `respondToDriverRideRequest`
- `clearDriverPendingRideRequest`

## Important Current Limitation

Frontend response currently updates:

- `ride_offers`
- `driver_locations`

It does **not** currently update `rides/{rideId}` status/driver assignment or passenger state from frontend.

That final ride assignment should be handled by backend accept/reject endpoints for full consistency and security.

## Recommended Next Step

Move Accept/Skip/Expire to server APIs:

- Frontend calls backend endpoint with `offerId` + action.
- Backend transaction should atomically update:
  - `ride_offers`
  - `rides`
  - `drivers`/`driver_locations`
  - passenger active ride fields as needed

This prevents race conditions and unauthorized state transitions.
