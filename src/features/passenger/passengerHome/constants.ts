import {
  Clock3,
  Home,
  Plane,
} from 'lucide-react-native';
import type { Region } from 'react-native-maps';

import type {
  HomeService,
  HomeShortcut,
  PaymentOption,
  QuickPlace,
  VehicleOption,
} from './types';


export const DEFAULT_REGION: Region = {
  latitude: 9.0579,
  longitude: 7.4951,
  latitudeDelta: 0.12,
  longitudeDelta: 0.08,
};

export const PICKUP_PLACES: QuickPlace[] = [
  {
    id: 'wuye',
    title: 'ALPHA ESTATE, WUYE',
    subtitle: 'Zone 7, Wuye District, Abuja',
    icon: Home,
    location: {
      address: 'Alpha Estate, Wuye, Abuja',
      coordinates: {
        latitude: 9.0648,
        longitude: 7.4467,
      },
    },
  },
  {
    id: 'habitat-garden',
    title: 'HABITAT POINT GARDEN',
    subtitle: 'Ahmadu Bello Way, Abuja',
    icon: Clock3,
    location: {
      address: 'Habitat Point Garden, Ahmadu Bello Way, Abuja',
      coordinates: {
        latitude: 9.072,
        longitude: 7.4894,
      },
    },
  },
  {
    id: 'airport',
    title: 'NNAMDI AZIKIWE INTERNATIONAL AIRPORT',
    subtitle: 'Abuja Municipal Area Council (AMAC)',
    icon: Plane,
    location: {
      address: 'Nnamdi Azikiwe International Airport, Abuja',
      coordinates: {
        latitude: 9.0069,
        longitude: 7.2632,
      },
    },
  },
];

export const DESTINATION_PLACES: QuickPlace[] = [
  {
    id: 'utako-market',
    title: 'UTAKO MODERN MARKET',
    subtitle: 'Utako District, Abuja',
    icon: Clock3,
    location: {
      address: 'Utako Modern Market, Utako, Abuja',
      coordinates: {
        latitude: 9.0762,
        longitude: 7.4165,
      },
    },
  },
  {
    id: 'jabi-lake',
    title: 'JABI LAKE MALL',
    subtitle: 'Bala Sokoto Way, Abuja',
    icon: Home,
    location: {
      address: 'Jabi Lake Mall, Bala Sokoto Way, Abuja',
      coordinates: {
        latitude: 9.0741,
        longitude: 7.4257,
      },
    },
  },
  {
    id: 'wuse-market',
    title: 'WUSE MARKET',
    subtitle: 'Sani Abacha Way, Abuja',
    icon: Plane,
    location: {
      address: 'Wuse Market, Sani Abacha Way, Abuja',
      coordinates: {
        latitude: 9.0683,
        longitude: 7.4829,
      },
    },
  },
];

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'standard',
    title: 'Switch Cab Standard',
    subtitle: 'Toyota Corolla  Gray',
    price: 'NGN5,500',
    rideType: 'single',
    badge: 'STD',
  },
  {
    id: 'regular',
    title: 'Switch Cab Regular',
    subtitle: 'Honda Civic  Black',
    price: 'NGN4,500',
    rideType: 'shared',
    badge: 'REG',
  },
];

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'switch-coins',
    title: 'Switch Coins',
    subtitle: 'You have 3000 Switch Coins',
  },
  {
    id: 'cash',
    title: 'Cash Payment',
    subtitle: 'Pay with cash at the end of trip',
  },
];




