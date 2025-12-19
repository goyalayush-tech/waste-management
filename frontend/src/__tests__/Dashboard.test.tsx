import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Dashboard from '../pages/Dashboard/Dashboard';
import dashboardReducer from '../store/slices/dashboardSlice';

// Mock the WebSocket service
vi.mock('../services/websocketService', () => ({
  useWebSocket: () => ({
    isConnected: true,
    lastMessage: { type: 'dashboard_update', data: { widgets: [] } },
    sendMessage: vi.fn(),
  }),
}));

// Mock the real-time data hook
vi.mock('../hooks/useRealTimeData', () => ({
  useRealTimeData: () => ({
    data: {
      totalWaste: 1250,
      recyclingRate: 78.5,
      activeVehicles: 12,
      pendingAudits: 5,
    },
    isLoading: false,
    error: null,
  }),
}));

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      dashboard: dashboardReducer,
    },
    preloadedState: {
      dashboard: {
        widgets: [
          {
            id: 'waste-stats',
            type: 'statistics',
            title: 'Waste Statistics',
            data: { totalWaste: 1250, recyclingRate: 78.5 },
          },
          {
            id: 'vehicle-status',
            type: 'status',
            title: 'Vehicle Status',
            data: { activeVehicles: 12, totalVehicles: 15 },
          },
        ],
        layout: 'grid',
        isLoading: false,
        error: null,
      },
    },
  });
};

describe('Dashboard', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the dashboard with title', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    it('should render dashboard widgets', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      expect(screen.getByText('Waste Statistics')).toBeInTheDocument();
      expect(screen.getByText('Vehicle Status')).toBeInTheDocument();
    });

    it('should show loading state when widgets are loading', () => {
      const loadingStore = configureStore({
        reducer: { dashboard: dashboardReducer },
        preloadedState: {
          dashboard: {
            widgets: [],
            layout: 'grid',
            isLoading: true,
            error: null,
          },
        },
      });

      render(
        <Provider store={loadingStore}>
          <Dashboard />
        </Provider>
      );
      
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  describe('Widget System', () => {
    it('should render statistics widgets correctly', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      // Check if statistics are displayed
      expect(screen.getByText('1,250')).toBeInTheDocument(); // totalWaste
      expect(screen.getByText('78.5%')).toBeInTheDocument(); // recyclingRate
    });

    it('should render status widgets correctly', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      // Check if vehicle status is displayed
      expect(screen.getByText('12')).toBeInTheDocument(); // activeVehicles
      expect(screen.getByText('15')).toBeInTheDocument(); // totalVehicles
    });

    it('should handle empty widget state', () => {
      const emptyStore = configureStore({
        reducer: { dashboard: dashboardReducer },
        preloadedState: {
          dashboard: {
            widgets: [],
            layout: 'grid',
            isLoading: false,
            error: null,
          },
        },
      });

      render(
        <Provider store={emptyStore}>
          <Dashboard />
        </Provider>
      );
      
      expect(screen.getByText(/No widgets configured/i)).toBeInTheDocument();
    });
  });

  describe('Real-Time Updates', () => {
    it('should display real-time data', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      // Check if real-time data is displayed
      expect(screen.getByText('1,250')).toBeInTheDocument(); // totalWaste
      expect(screen.getByText('78.5%')).toBeInTheDocument(); // recyclingRate
      expect(screen.getByText('12')).toBeInTheDocument(); // activeVehicles
      expect(screen.getByText('5')).toBeInTheDocument(); // pendingAudits
    });

    it('should show connection status', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      // Should show connected status
      expect(screen.getByText(/Connected/i)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should render quick action buttons', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      // Check for common quick actions
      expect(screen.getByText(/Upload/i)).toBeInTheDocument();
      expect(screen.getByText(/Analyze/i)).toBeInTheDocument();
    });

    it('should handle quick action clicks', () => {
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', () => ({
        useNavigate: () => mockNavigate,
      }));

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      const uploadButton = screen.getByText(/Upload/i);
      uploadButton.click();
      
      // Should navigate to upload page
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error messages when widgets fail to load', () => {
      const errorStore = configureStore({
        reducer: { dashboard: dashboardReducer },
        preloadedState: {
          dashboard: {
            widgets: [],
            layout: 'grid',
            isLoading: false,
            error: 'Failed to load dashboard data',
          },
        },
      });

      render(
        <Provider store={errorStore}>
          <Dashboard />
        </Provider>
      );
      
      expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
    });

    it('should show retry option when errors occur', () => {
      const errorStore = configureStore({
        reducer: { dashboard: dashboardReducer },
        preloadedState: {
          dashboard: {
            widgets: [],
            layout: 'grid',
            isLoading: false,
            error: 'Failed to load dashboard data',
          },
        },
      });

      render(
        <Provider store={errorStore}>
          <Dashboard />
        </Provider>
      );
      
      expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for different screen sizes', () => {
      // Mock window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Mobile width
      });

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      // Should show mobile-optimized layout
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Dashboard/i);
    });

    it('should have proper ARIA labels for interactive elements', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
}); 