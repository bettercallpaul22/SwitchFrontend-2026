import React, { useEffect, useState } from 'react';

import { DriverHomeScreen } from '../features/driver/screens/DriverHomeScreen';
import { DriverProfileSetupScreen } from '../features/driver/screens/DriverProfileSetupScreen';
import { PassengerHomeScreen } from '../features/passenger/screens/PassengerHomeScreen';
import { useAppSelector } from '../store/hooks';

export function HomeScreen() {
  const activeRole = useAppSelector((state) => state.auth.activeRole);
  const [driverView, setDriverView] = useState<'home' | 'profile-setup'>('home');

  useEffect(() => {
    if (activeRole !== 'driver') {
      setDriverView('home');
    }
  }, [activeRole]);

  if (activeRole === 'driver') {
    if (driverView === 'profile-setup') {
      return <DriverProfileSetupScreen onBack={() => setDriverView('home')} />;
    }

    return <DriverHomeScreen onNavigateToProfileSetup={() => setDriverView('profile-setup')} />;
  }

  return <PassengerHomeScreen />;
}
