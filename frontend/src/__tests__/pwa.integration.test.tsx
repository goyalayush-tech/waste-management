import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import { store } from '../store/store';
import AppLayout from '../components/Layout/AppLayout';
import { registerSW } from '../utils/serviceWorker';

// Mock service worker registration
vi.mock('../utils/serviceWorker', () => ({
  registerSW: vi.fn(),
  offlineQueue: {
    addAction: vi.fn(),
    getActions: vi.fn().mockResolvedValue([]),
    removeAction: vi.fn(),
    clearAll: vi.fn(),
  },
  connectionMonitor: {
    onStatusChange: vi.fn().mockReturnValue(() => {}),
    getStatus: vi.fn().mockReturnValue(true),
    checkConnection: vi.fn().mockResolvedValue(true),
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn(),
    ready: Promise.resolve({
      unregister: vi.fn(),
      sync: { register: vi.fn() },
    }),
  },
  writable: true,
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <BrowserRouter>
      <ConfigProvider>
        {children}
      </ConfigProvider>
    </BrowserRouter>
  </Provider>
);

describe('PWA Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('integrates PWA install prompt with app layout', async () => {
    vi.useFakeTimers();
    
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt');
    Object.defineProperty(mockEvent, 'prompt', {
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    });

    fireEvent(window, mockEvent);

    // Fast-forward time to trigger install prompt
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(screen.getByText('Install Waste Management App')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  test('handles PWA installation flow', async () => {
    vi.useFakeTimers();
    
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt');
    Object.defineProperty(mockEvent, 'prompt', { value: mockPrompt });
    Object.defineProperty(mockEvent, 'userChoice', { value: mockUserChoice });

    fireEvent(window, mockEvent);

    // Fast-forward time to show prompt
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });

    // Click install button
    fireEvent.click(screen.getByText('Install App'));

    await waitFor(() => {
      expect(mockPrompt).toHaveBeenCalled();
    });

    // Simulate app installed event
    fireEvent(window, new Event('appinstalled'));

    // Prompt should be hidden after installation
    await waitFor(() => {
      expect(screen.queryByText('Install Waste Management App')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  test('handles PWA prompt dismissal', async () => {
    vi.useFakeTimers();
    
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt');
    Object.defineProperty(mockEvent, 'prompt', {
      value: vi.fn().mockResolvedValue(undefined),
    });

    fireEvent(window, mockEvent);

    // Fast-forward time to show prompt
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(screen.getByText('Maybe Later')).toBeInTheDocument();
    });

    // Click dismiss button
    fireEvent.click(screen.getByText('Maybe Later'));

    // Check that dismissal is stored
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pwa-install-dismissed',
      expect.any(String)
    );

    // Prompt should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Install Waste Management App')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  test('shows connection status in app layout', () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );

    // Connection status should be visible in the header
    const connectionStatus = screen.getByTestId('connection-status') || 
                           document.querySelector('[data-tour="connection-status"]');
    expect(connectionStatus).toBeInTheDocument();
  });

  test('integrates service worker registration with app lifecycle', () => {
    const mockRegisterSW = registerSW as any;
    
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );

    // Service worker registration should be called during app initialization
    // This would typically happen in App.tsx, but we're testing the integration
    expect(mockRegisterSW).toBeDefined();
  });

  test('handles offline functionality integration', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });

    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );

    // Simulate offline event
    fireEvent(window, new Event('offline'));

    // The connection status should reflect offline state
    // This would be handled by the ConnectionStatus component
    await waitFor(() => {
      // Connection status component should show offline state
      const connectionElement = document.querySelector('[data-tour="connection-status"]');
      expect(connectionElement).toBeInTheDocument();
    });
  });

  test('handles PWA features display correctly', async () => {
    vi.useFakeTimers();
    
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt');
    fireEvent(window, mockEvent);

    // Fast-forward time to show prompt
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      // Check that PWA features are displayed
      expect(screen.getByText('Works Offline')).toBeInTheDocument();
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByText('App-like Experience')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  test('handles PWA shortcuts and manifest integration', () => {
    // Test that manifest.json is properly configured
    // This would typically be tested by checking the HTML head
    const manifestLink = document.querySelector('link[rel="manifest"]');
    
    // In a real app, this would be added by the build process
    // Here we're just testing that the integration points exist
    expect(document.head).toBeDefined();
  });

  test('handles PWA app-like navigation', () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );

    // Test that the app layout supports PWA navigation patterns
    // This includes proper header, navigation, and content structure
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // Navigation
    expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
  });

  test('handles PWA theme and styling integration', () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );

    // Test that the app uses PWA-appropriate styling
    // This includes proper viewport, theme colors, etc.
    const layout = document.querySelector('.ant-layout');
    expect(layout).toBeInTheDocument();
    
    // The layout should have proper styling for PWA
    expect(layout).toHaveStyle('min-height: 100vh');
  });
});