import { configureStore } from '@reduxjs/toolkit';
import navigationReducer from './slices/navigationSlice';
import dashboardReducer from './slices/dashboardSlice';
import uiReducer from './slices/uiSlice';
import wasteAnalysisReducer from './slices/wasteAnalysisSlice';
import contaminationReducer from './slices/contaminationSlice';
import claimCleanReducer from './slices/claimCleanSlice';

// Create placeholder reducers for existing slices
const createPlaceholderReducer = () => (state = {}) => state;

export const store = configureStore({
  reducer: {
    // New UI slices
    navigation: navigationReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
    
    // Phase 1: ClaimClean slice
    claimClean: claimCleanReducer,
    
    // Existing slices (preserved for future phases)
    wasteAnalysis: wasteAnalysisReducer,
    contamination: contaminationReducer,
    metaverse: createPlaceholderReducer(),
    quantum: createPlaceholderReducer(),
    autonomous: createPlaceholderReducer(),
    digitalTwin: createPlaceholderReducer(),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['ui.notifications'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;