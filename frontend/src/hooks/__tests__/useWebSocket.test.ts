import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import { useWebSocket } from '../useWebSocket';
import { websocketService } from '../../services/websocketService';

// Mock the websocket service
vi.mock('../../services/websocketService', () => ({
  websocketService: {
    getConnectionStatus: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    reconnect: vi.fn(),
    send: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
}));

const mockWebSocketService = websocketService as any;

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock return values
    mockWebSocketService.getConnectionStatus.mockReturnValue({
      state: 'DISCONNECTED',
      reconnectAttempts: 0,
    });
    
    mockWebSocketService.connect.mockResolvedValue();
    mockWebSocketService.subscribe.mockReturnValue(() => {});
  });

  test('should return initial connection status', () => {
    const { result } = renderHook(() => useWebSocket());
    
    expect(result.current.connectionState).toBe('DISCONNECTED');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.reconnectAttempts).toBe(0);
  });

  test('should update connection status when service status changes', () => {
    const { result, rerender } = renderHook(() => useWebSocket());
    
    // Initially disconnected
    expect(result.current.connectionState).toBe('DISCONNECTED');
    
    // Mock service returning connected status
    mockWebSocketService.getConnectionStatus.mockReturnValue({
      state: 'CONNECTED',
      reconnectAttempts: 0,
      lastConnected: new Date(),
    });
    
    // Trigger re-render to simulate the interval update
    act(() => {
      rerender();
    });
    
    expect(result.current.connectionState).toBe('CONNECTED');
    expect(result.current.isConnected).toBe(true);
  });

  test('should handle connecting state', () => {
    mockWebSocketService.getConnectionStatus.mockReturnValue({
      state: 'CONNECTING',
      reconnectAttempts: 0,
    });
    
    const { result } = renderHook(() => useWebSocket());
    
    expect(result.current.connectionState).toBe('CONNECTING');
    expect(result.current.isConnecting).toBe(true);
    expect(result.current.isConnected).toBe(false);
  });

  test('should handle reconnecting state', () => {
    mockWebSocketService.getConnectionStatus.mockReturnValue({
      state: 'RECONNECTING',
      reconnectAttempts: 3,
    });
    
    const { result } = renderHook(() => useWebSocket());
    
    expect(result.current.connectionState).toBe('RECONNECTING');
    expect(result.current.isReconnecting).toBe(true);
    expect(result.current.reconnectAttempts).toBe(3);
  });

  test('should handle error state', () => {
    mockWebSocketService.getConnectionStatus.mockReturnValue({
      state: 'ERROR',
      reconnectAttempts: 5,
      error: 'Connection failed',
    });
    
    const { result } = renderHook(() => useWebSocket());
    
    expect(result.current.connectionState).toBe('ERROR');
    expect(result.current.hasError).toBe(true);
    expect(result.current.error).toBe('Connection failed');
  });

  test('should call connect method', async () => {
    const { result } = renderHook(() => useWebSocket());
    
    await act(async () => {
      await result.current.connect('ws://test-server');
    });
    
    expect(mockWebSocketService.connect).toHaveBeenCalledWith('ws://test-server');
  });

  test('should call disconnect method', () => {
    const { result } = renderHook(() => useWebSocket());
    
    act(() => {
      result.current.disconnect();
    });
    
    expect(mockWebSocketService.disconnect).toHaveBeenCalled();
  });

  test('should call reconnect method', () => {
    const { result } = renderHook(() => useWebSocket());
    
    act(() => {
      result.current.reconnect();
    });
    
    expect(mockWebSocketService.reconnect).toHaveBeenCalled();
  });

  test('should send messages', () => {
    const { result } = renderHook(() => useWebSocket());
    
    const message = {
      type: 'TEST_MESSAGE',
      payload: { test: 'data' },
    };
    
    act(() => {
      result.current.sendMessage(message);
    });
    
    expect(mockWebSocketService.send).toHaveBeenCalledWith({
      ...message,
      timestamp: expect.any(String),
    });
  });

  test('should handle subscriptions', () => {
    const { result } = renderHook(() => useWebSocket());
    const callback = vi.fn();
    const mockUnsubscribe = vi.fn();
    
    mockWebSocketService.subscribe.mockReturnValue(mockUnsubscribe);
    
    let unsubscribe: (() => void) | undefined;
    
    act(() => {
      unsubscribe = result.current.subscribe('test-channel', callback);
    });
    
    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('test-channel', callback);
    expect(unsubscribe).toBeDefined();
    
    // Test unsubscribe
    act(() => {
      unsubscribe!();
    });
    
    expect(mockWebSocketService.unsubscribe).toHaveBeenCalledWith('test-channel');
  });

  test('should include last connected time', () => {
    const lastConnected = new Date();
    mockWebSocketService.getConnectionStatus.mockReturnValue({
      state: 'CONNECTED',
      reconnectAttempts: 0,
      lastConnected,
    });
    
    const { result } = renderHook(() => useWebSocket());
    
    expect(result.current.lastConnected).toBe(lastConnected);
  });

  test('should memoize callback functions', () => {
    const { result, rerender } = renderHook(() => useWebSocket());
    
    const firstConnect = result.current.connect;
    const firstDisconnect = result.current.disconnect;
    const firstSendMessage = result.current.sendMessage;
    const firstSubscribe = result.current.subscribe;
    
    rerender();
    
    expect(result.current.connect).toBe(firstConnect);
    expect(result.current.disconnect).toBe(firstDisconnect);
    expect(result.current.sendMessage).toBe(firstSendMessage);
    expect(result.current.subscribe).toBe(firstSubscribe);
  });
});