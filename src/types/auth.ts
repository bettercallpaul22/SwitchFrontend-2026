import type { RideStatus } from './ride';

export type UserRole = 'driver' | 'passenger';
export type PassengerRideStatus = 'idle' | RideStatus;

type BaseUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fcmToken: string;
  isOnline?: boolean;
  isAvailable?: boolean;
  activeRideId?: string | null;
  lastKnownLocation?: {
    lat: number;
    lng: number;
  };
  lastKnownGeohash?: string;
  lastLocationUpdatedAt?: string;
  termsAccepted?: true;
  createdAt: string;
  updatedAt: string;
};

export type BasicProfile = {
  idNumber: string;
  driverLicenseUrl: string;
  profilePhotoUrl: string;
  ninSlipUrl: string;
};

export type VehicleDetails = {
  make: string;
  model: string;
  color: string;
  plateNumber: string;
};

export type EarningPreference = 'one_time_payment_daily' | 'commission_based' | 'subscription';

export type DriverPreference = {
  earningPreference: EarningPreference;
};

export type DriverProfileInput = {
  basicProfile?: BasicProfile;
  vehicleDetails?: VehicleDetails;
  preference?: DriverPreference;
};

export type DriverProfile = {
  basicProfile: BasicProfile | null;
  vehicleDetails: VehicleDetails | null;
  preference: DriverPreference | null;
};

export type DriverMatchingStats = {
  ratingAverage: number;
  ratingCount: number;
  completedTrips: number;
};

export type PassengerUser = BaseUser & {
  role: 'passenger';
  dateOfBirth?: string;
  walletBalance: number;
  switchCoinBalance: number;
  rideStatus: PassengerRideStatus;
  activeRideId: string | null;
};

export type DriverUserFromApi = BaseUser & {
  role: 'driver';
} & DriverProfileInput & DriverMatchingStats;

export type DriverUser = BaseUser & {
  role: 'driver';
} & DriverProfile & DriverMatchingStats;

export type AuthApiUser = PassengerUser | DriverUserFromApi;
export type AppUser = PassengerUser | DriverUser;

export type LoginResponseData = {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthApiUser;
};

export type AuthSession = {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: AppUser;
};

type BaseRegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: true;
};

export type PassengerRegisterPayload = BaseRegisterPayload & {
  dateOfBirth?: string;
};

export type DriverRegisterPayload = BaseRegisterPayload & DriverProfileInput;
export type DriverProfileUpdatePayload = DriverProfileInput & {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type RegisterPayloadByRole = {
  passenger: PassengerRegisterPayload;
  driver: DriverRegisterPayload;
};

export type RegisterPayload = PassengerRegisterPayload | DriverRegisterPayload;

export type LoginPayload = {
  email: string;
  password: string;
};
