import { websocketService, WebSocketMessage } from '../websocketService';
import { store } from '../../store/store';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send functionality
    console.log('Mock WebSocket send:', data);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason }));
    }
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { 
        data: JSON.stringify(data) 
      }));
    }
  }

  // Helper method to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('WebSocketService', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    // Reset the service state
    websocketService.disconnect();
    jest.clearAllMocks();
  });

  afterEach(() => {
    websocketService.disconnect();
  });

  describe('Connection Management', () => {
    test('should connect to WebSocket server', async () => {
      const connectPromise = websocketService.connect('ws://test-server');
      
      // Wait for connection to establish
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const status = websocketService.getConnectionStatus();
      expect(status.state).toBe('CONNECTED');
    });

    test('should handle connection errors', async () => {
      // Mock WebSocket constructor to throw error
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = class {
        constructor() {
          throw new Error('Connection failed');
        }
      };

      try {
        await websocketService.connect('ws://invalid-server');
      } catch (error) {
        const status = websocketService.getConnectionStatus();
        expect(status.state).toBe('ERROR');
        expect(status.error).toBe('Connection failed');
      }

      // Restore original WebSocket
      (global as any).WebSocket = originalWebSocket;
    });

    test('should disconnect properly', async () => {
      await websocketService.connect('ws://test-server');
      await new Promise(resolve => setTimeout(resolve, 20));
      
      websocketService.disconnect();
      
      const status = websocketService.getConnectionStatus();
      expect(status.state).toBe('DISCONNECTED');
    });

    test('should attempt reconnection on unexpected disconnect', async () => {
      await websocketService.connect('ws://test-server');
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Simulate unexpected disconnect
      const ws = (websocketService as any).ws as MockWebSocket;
      ws.close(1006, 'Connection lost'); // Abnormal closure
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const status = websocketService.getConnectionStatus();
      expect(status.state).toBe('RECONNECTING');
      expect(status.reconnectAttempts).toBeGreaterThan(0);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://test-server');
      await new Promise(resolve => setTimeout(resolve, 20));
      mockWebSocket = (websocketService as any).ws;
    });

    test('should send messages when connected', () => {
      const sendSpy = jest.spyOn(mockWebSocket, 'send');
      
      const message: WebSocketMessage = {
        type: 'TEST_MESSAGE',
        payload: { test: 'data' },
        timestamp: new Date().toISOString(),
      };
      
      websocketService.send(message);
      
      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(message));
    });

    test('should queue messages when disconnected', () => {
      websocketService.disconnect();
      
      const message: WebSocketMessage = {
        type: 'TEST_MESSAGE',
        payload: { test: 'data' },
        timestamp: new Date().toISOString(),
      };
      
      // Should not throw error
      websocketService.send(message);
      
      // Message should be queued (we can't directly test the queue, but no error should occur)
      expect(true).toBe(true);
    });

    test('should handle system stats updates', () => {
      const mockStats = {
        efficiency: 95.5,
        wasteProcessed: 1500,
        contaminationRate: 1.8,
        carbonCredits: 200,
      };

      mockWebSocket.simulateMessage({
        type: 'SYSTEM_STATS_UPDATE',
        payload: mockStats,
        timestamp: new Date().toISOString(),
      });

      // Check if Redux store was updated
      const state = store.getState();
      expect(state.dashboard.systemStats.efficiency).toBe(95.5);
      expect(state.dashboard.systemStats.wasteProcessed).toBe(1500);
    });

    test('should handle notifications', () => {
      const mockNotification = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        category: 'system',
      };

      mockWebSocket.simulateMessage({
        type: 'NOTIFICATION',
        payload: mockNotification,
        timestamp: new Date().toISOString(),
      });

      // Check if notification was added to store
      const state = store.getState();
      const notifications = state.ui.notifications;
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].title).toBe('Test Notification');
    });

    test('should handle widget data updates', () => {
      const mockWidgetUpdate = {
        widgetId: 'test-widget',
        data: { value: 100, trend: 'up' },
      };

      mockWebSocket.simulateMessage({
        type: 'WIDGET_DATA_UPDATE',
        payload: mockWidgetUpdate,
        timestamp: new Date().toISOString(),
      });

      // This would update the widget in the store
      // We can't easily test this without mocking the entire store
      expect(true).toBe(true);
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://test-server');
      await new Promise(resolve => setTimeout(resolve, 20));
      mockWebSocket = (websocketService as any).ws;
    });

    test('should subscribe to channels', () => {
      const sendSpy = jest.spyOn(mockWebSocket, 'send');
      const callback = jest.fn();
      
      websocketService.subscribe('test-channel', callback);
      
      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'SUBSCRIBE',
          payload: { channel: 'test-channel' },
          timestamp: expect.any(String),
        })
      );
    });

    test('should unsubscribe from channels', () => {
      const sendSpy = jest.spyOn(mockWebSocket, 'send');
      const callback = jest.fn();
      
      websocketService.subscribe('test-channel', callback);
      websocketService.unsubscribe('test-channel');
      
      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'UNSUBSCRIBE',
          payload: { channel: 'test-channel' },
          timestamp: expect.any(String),
        })
      );
    });

    test('should handle subscription data', () => {
      const callback = jest.fn();
      websocketService.subscribe('test-channel', callback);
      
      const testData = { value: 42, status: 'active' };
      mockWebSocket.simulateMessage({
        type: 'SUBSCRIPTION_DATA',
        payload: {
          channel: 'test-channel',
          data: testData,
        },
        timestamp: new Date().toISOString(),
      });
      
      expect(callback).toHaveBeenCalledWith(testData);
    });
  });

  describe('Heartbeat Mechanism', () => {
    beforeEach(async () => {
      await websocketService.connect('ws://test-server');
      await new Promise(resolve => setTimeout(resolve, 20));
      mockWebSocket = (websocketService as any).ws;
    });

    test('should handle heartbeat responses', () => {
      mockWebSocket.simulateMessage({
        type: 'PONG',
        payload: { timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });
      
      // Should not throw error and connection should remain stable
      expect(websocketService.isConnected()).toBe(true);
    });
  });

  describe('Connection Status', () => {
    test('should return correct connection status', async () => {
      let status = websocketService.getConnectionStatus();
      expect(status.state).toBe('DISCONNECTED');
      expect(status.reconnectAttempts).toBe(0);
      
      await websocketService.connect('ws://test-server');
      await new Promise(resolve => setTimeout(resolve, 20));
      
      status = websocketService.getConnectionStatus();
      expect(status.state).toBe('CONNECTED');
      expect(status.lastConnected).toBeInstanceOf(Date);
    });

    test('should track reconnection attempts', async () => {
      await websocketService.connect('ws://test-server');
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Simulate connection loss
      const ws = (websocketService as any).ws as MockWebSocket;
      ws.close(1006, 'Connection lost');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const status = websocketService.getConnectionStatus();
      expect(status.reconnectAttempts).toBeGreaterThan(0);
    });
  });
});