import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  category: 'system' | 'analysis' | 'contamination' | 'blockchain' | 'maintenance';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dashboardLayout: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

interface UIState {
  notifications: Notification[];
  notificationCenterOpen: boolean;
  searchQuery: string;
  searchResults: any[];
  searchLoading: boolean;
  userPreferences: UserPreferences;
  globalLoading: boolean;
  globalError: string | null;
}

const initialState: UIState = {
  notifications: [
    {
      id: '1',
      title: 'Contamination Detected',
      message: 'Batch WB-2024-001 flagged for high contamination levels. Immediate attention required.',
      type: 'warning',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      category: 'contamination',
    },
    {
      id: '2',
      title: 'Analysis Complete',
      message: 'Multi-modal analysis for batch WB-2024-002 completed with 98.7% confidence.',
      type: 'success',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
      category: 'analysis',
    },
    {
      id: '3',
      title: 'NFT Certificate Minted',
      message: 'New waste processing certificate #2847 successfully minted on blockchain.',
      type: 'success',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: true,
      category: 'blockchain',
    },
  ],
  notificationCenterOpen: false,
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  userPreferences: {
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    dashboardLayout: 'default',
    notificationsEnabled: true,
    soundEnabled: true,
  },
  globalLoading: false,
  globalError: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      state.notifications.unshift(notification);
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setNotificationCenterOpen: (state, action: PayloadAction<boolean>) => {
      state.notificationCenterOpen = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
    },
    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.searchLoading = action.payload;
    },
    updateUserPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.userPreferences = { ...state.userPreferences, ...action.payload };
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
    },
  },
});

export const {
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearAllNotifications,
  setNotificationCenterOpen,
  setSearchQuery,
  setSearchResults,
  setSearchLoading,
  updateUserPreferences,
  setGlobalLoading,
  setGlobalError,
} = uiSlice.actions;

export default uiSlice.reducer;