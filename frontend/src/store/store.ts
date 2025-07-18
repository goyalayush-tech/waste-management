import { configureStore } from '@reduxjs/toolkit';

// Create placeholder reducers for now
const createPlaceholderReducer = (name: string) => (state = {}, action: any) => state;

export const store = configureStore({
  reducer: {
    wasteAnalysis: createPlaceholderReducer('wasteAnalysis'),
    contamination: createPlaceholderReducer('contamination'),
    metaverse: createPlaceholderReducer('metaverse'),
    quantum: createPlaceholderReducer('quantum'),
    autonomous: createPlaceholderReducer('autonomous'),
    digitalTwin: createPlaceholderReducer('digitalTwin'),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;