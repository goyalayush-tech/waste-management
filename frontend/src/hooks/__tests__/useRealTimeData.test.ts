import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';
import { useRealTimeData } from '../useRealTimeData';
import { useWebSocket } from '../useWebSocket';

// Mock the useWebSocket hook
vi.mock('../useWebSocket', () => ({
  useWebSocket: vi.fn(),
}));

const mockUseWebSocket = useWebSocket as ReturnType<typeof vi.fn>;

describe('useRealTimeData', () => {
  const mockSubscribe = vi.fn();
  const mockSendMessage = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Default mock return values
    mockUseWebSocket.mockReturnValue({
      isConnected: true,
      subscribe: mockSubscribe,
      sendMessage: mockSendMessage,
      connectionStatus: { state: 'CONNECTED', reconnectAttempts: 0 },
      connectionState: 'CONNECTED',
      isConnecting: false,
      isReconnecting: false,
      hasError: false,
      reconnectAttempts: 0,
      lastConnected: new Date(),
      error: undefined,
      lastMessage: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
    });
    
    mockSubscribe.mockReturnValue(() => {});
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  test('should initialize with default state', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
    };
    
    const { result } = renderHook(() => useRealTimeData(config));
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeNull();
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isConnected).toBe(true);
  });

  test('should auto-subscribe when connected', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
      autoSubscribe: true,
    };
    
    renderHook(() => useRealTimeData(config));
    
    expect(mockSubscribe).toHaveBeenCalledWith('test-channel', expect.any(Function));
  });

  test('should not auto-subscribe when autoSubscribe is false', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
      autoSubscribe: false,
    };
    
    renderHook(() => useRealTimeData(config));
    
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  test('should handle data updates', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
    };
    
    let dataCallback: (data: any) => void = () => {};
    mockSubscribe.mockImplementation((_channel: any, callback: any) => {
      dataCallback = callback;
      return () => {};
    });
    
    const { result } = renderHook(() => useRealTimeData(config));
    
    const testData = { value: 100, status: 'active' };
    
    act(() => {
      dataCallback(testData);
    });
    
    expect(result.current.data).toEqual(testData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  test('should handle errors', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
    };
    
    let dataCallback: (data: any) => void = () => {};
    mockSubscribe.mockImplementation((_channel: any, callback: any) => {
      dataCallback = callback;
      return () => {};
    });
    
    const { result } = renderHook(() => useRealTimeData(config));
    
    act(() => {
      dataCallback({ error: 'Test error' });
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Test error');
  });

  test('should handle manual subscription', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
      autoSubscribe: false,
    };
    
    const { result } = renderHook(() => useRealTimeData(config));
    
    act(() => {
      result.current.subscribe();
    });
    
    expect(mockSubscribe).toHaveBeenCalledWith('test-channel', expect.any(Function));
    expect(result.current.isSubscribed).toBe(true);
  });

  test('should handle refresh data', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
    };
    
    const { result } = renderHook(() => useRealTimeData(config));
    
    act(() => {
      result.current.refresh();
    });
    
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'REQUEST_WIDGET_DATA',
      payload: {
        widgetId: 'test-widget',
        channel: 'test-channel',
      },
    });
  });

  test('should set up refresh interval', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
      refreshInterval: 5000,
    };
    
    const { result } = renderHook(() => useRealTimeData(config));
    
    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'REQUEST_WIDGET_DATA',
      payload: {
        widgetId: 'test-widget',
        channel: 'test-channel',
      },
    });
  });

  test('should not subscribe when disconnected', () => {
    mockUseWebSocket.mockReturnValue({
      isConnected: false,
      subscribe: mockSubscribe,
      sendMessage: mockSendMessage,
      connectionStatus: { state: 'DISCONNECTED', reconnectAttempts: 0 },
      connectionState: 'DISCONNECTED',
      isConnecting: false,
      isReconnecting: false,
      hasError: false,
      reconnectAttempts: 0,
      lastConnected: undefined,
      error: undefined,
      lastMessage: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
    });
    
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
    };
    
    renderHook(() => useRealTimeData(config));
    
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  test('should handle unsubscription', () => {
    const mockUnsubscribe = vi.fn();
    mockSubscribe.mockReturnValue(mockUnsubscribe);
    
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
    };
    
    const { result, unmount } = renderHook(() => useRealTimeData(config));
    
    // Subscription should happen automatically
    expect(result.current.isSubscribed).toBe(true);
    
    // Unmount should trigger unsubscription
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  test('should handle loading states correctly', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
      autoSubscribe: false,
    };
    
    const { result } = renderHook(() => useRealTimeData(config));
    
    // Initially not loading
    expect(result.current.loading).toBe(false);
    
    // Should set loading when subscribing
    act(() => {
      result.current.subscribe();
    });
    
    expect(result.current.loading).toBe(false); // Loading is set to false after subscription
    expect(result.current.isSubscribed).toBe(true);
  });

  test('should prevent duplicate subscriptions', () => {
    const config = {
      widgetId: 'test-widget',
      channel: 'test-channel',
    };
    
    const { result } = renderHook(() => useRealTimeData(config));
    
    // First subscription (auto)
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    
    // Try to subscribe again manually
    act(() => {
      result.current.subscribe();
    });
    
    // Should not call subscribe again
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });
});