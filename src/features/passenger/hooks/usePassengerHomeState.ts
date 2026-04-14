import { useCallback } from 'react';

import { logout, setActiveRole } from '../../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { UserRole } from '../../../types/auth';

export function usePassengerHomeState() {
  const dispatch = useAppDispatch();
  const { session, activeRole, status } = useAppSelector((state) => state.auth);

  const onRoleChange = useCallback(
    (role: UserRole) => {
      dispatch(setActiveRole(role));
    },
    [dispatch]
  );

  const onLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return {
    session,
    activeRole,
    isLoading: status === 'loading',
    onRoleChange,
    onLogout
  };
}
