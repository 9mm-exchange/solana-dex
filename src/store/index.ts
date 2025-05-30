import { configureStore } from '@reduxjs/toolkit';
import positionReducer from './slices/positionSlice';

export const store = configureStore({
  reducer: {
    positions: positionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 