import { configureStore } from '@reduxjs/toolkit';
import positionReducer from './slices/positionSlice';
import tokenReducer from './slices/tokenSlice';

export const store = configureStore({
  reducer: {
    positions: positionReducer,
    tokens: tokenReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 