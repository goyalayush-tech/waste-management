import { configureStore } from '@reduxjs/toolkit';
import navigationReducer from './slices/navigationSlice';
import dashboardReducer from './slices/dashboardSlice';
import uiReducer from './slices/uiSlice';
import wasteAnalysisReducer from './slices/wasteAnalysisSlice';
import contaminationReducer from './slices/contaminationSlice';

// Create placeholder reducers for existing slices
const createPlaceholderReducer = () => (state = {}) => state;

export const store = configureStore({
  reducer: {
    // New UI slices
    navigation: navigationReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
    
    // Existing slices
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