import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Backward-compatible aliases requested in some screens/modules.
export const useappdispatch = useAppDispatch;
export const useAppSeletor = useAppSelector;
