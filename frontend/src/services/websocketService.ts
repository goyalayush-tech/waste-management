import { store } from '../store/store';
import { updateSystemStats, updateWidget } from '../store/slices/dashboardSlice';
import { addNotification } from '../store/slices/uiSlice';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
}

export interface ConnectionStatus {
  state: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR';
  lastConnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

export interface RealTimeDataUpdate {
  widgetId: string;
  data: any;
  timestamp: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 3000;
  private maxReconnectInterval = 30000;
  private isConnecting = false;
  private connectionStatus: ConnectionStatus = {
    state: 'DISCONNECTED',
    reconnectAttempts: 0,
  };
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private subscribers: Map<string, (data: any) => void> = new Map();
  private url: string = 'ws://localhost:8080/ws';

  connect(url: string = 'ws://localhost:8080/ws') {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    this.url = url;
    this.isConnecting = true;
    this.updateConnectionStatus('CONNECTING');

    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.updateConnectionStatus('CONNECTED', new Date());
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Process queued messages
          this.processMessageQueue();
          
          // Send initial connection message
          this.send({
            type: 'CONNECT',
            payload: { 
              clientId: this.generateClientId(),
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
            },
            timestamp: new Date().toISOString(),
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.ws = null;
          this.stopHeartbeat();

          // Update connection status
          if (event.code === 1000) {
            this.updateConnectionStatus('DISCONNECTED');
          } else {
            this.updateConnectionStatus('RECONNECTING');
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.updateConnectionStatus('ERROR', undefined, 'Connection failed');
          reject(error);
        };

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        this.isConnecting = false;
        this.updateConnectionStatus('ERROR', undefined, error instanceof Error ? error.message : 'Unknown error');
        reject(error);
      }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.updateConnectionStatus('DISCONNECTED');
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later if not connected
      this.messageQueue.push(message);
      console.warn('WebSocket is not connected. Message queued:', message);
    }
  }

  // Subscribe to specific data updates
  subscribe(channel: string, callback: (data: any) => void) {
    this.subscribers.set(channel, callback);
    
    // Send subscription message if connected
    if (this.isConnected()) {
      this.send({
        type: 'SUBSCRIBE',
        payload: { channel },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Unsubscribe from data updates
  unsubscribe(channel: string) {
    this.subscribers.delete(channel);
    
    // Send unsubscription message if connected
    if (this.isConnected()) {
      this.send({
        type: 'UNSUBSCRIBE',
        payload: { channel },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Force reconnection
  reconnect() {
    this.disconnect();
    setTimeout(() => {
      this.connect(this.url);
    }, 1000);
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, payload } = message;

    switch (type) {
      case 'PONG':
        // Handle heartbeat response
        this.handleHeartbeatResponse();
        break;

      case 'SYSTEM_STATS_UPDATE':
        store.dispatch(updateSystemStats(payload));
        break;

      case 'WIDGET_DATA_UPDATE':
        // Handle real-time widget data updates
        if (payload.widgetId && payload.data) {
          store.dispatch(updateWidget({
            id: payload.widgetId,
            updates: { data: payload.data }
          }));
        }
        break;

      case 'SUBSCRIPTION_DATA':
        // Handle subscribed channel data
        const callback = this.subscribers.get(payload.channel);
        if (callback) {
          callback(payload.data);
        }
        break;

      case 'NOTIFICATION':
        store.dispatch(addNotification({
          title: payload.title,
          message: payload.message,
          type: payload.type || 'info',
          category: payload.category || 'system',
          read: false,
        }));
        break;

      case 'CONTAMINATION_ALERT':
        store.dispatch(addNotification({
          title: 'Contamination Detected',
          message: `Batch ${payload.batchId} flagged for contamination`,
          type: 'warning',
          category: 'contamination',
          read: false,
        }));
        break;

      case 'ANALYSIS_COMPLETE':
        store.dispatch(addNotification({
          title: 'Analysis Complete',
          message: `Analysis for batch ${payload.batchId} completed with ${payload.confidence}% confidence`,
          type: 'success',
          category: 'analysis',
          read: false,
        }));
        break;

      case 'CERTIFICATE_MINTED':
        store.dispatch(addNotification({
          title: 'NFT Certificate Minted',
          message: `Certificate #${payload.certificateId} successfully minted`,
          type: 'success',
          category: 'blockchain',
          read: false,
        }));
        break;

      case 'CONNECTION_ACK':
        console.log('Connection acknowledged by server:', payload);
        break;

      default:
        console.log('Unknown message type:', type, payload);
    }
  }

  private updateConnectionStatus(state: ConnectionStatus['state'], lastConnected?: Date, error?: string) {
    this.connectionStatus = {
      state,
      lastConnected: lastConnected || this.connectionStatus.lastConnected,
      reconnectAttempts: this.reconnectAttempts,
      error,
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateConnectionStatus('ERROR', undefined, 'Max reconnection attempts reached');
      return;
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      this.maxReconnectInterval
    );

    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect(this.url);
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'PING',
          payload: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });

        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - connection may be lost');
          this.ws?.close();
        }, 5000);
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private handleHeartbeatResponse() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws?.send(JSON.stringify(message));
      }
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Auto-connect when service is imported (in development, we'll simulate the connection)
if (process.env.NODE_ENV === 'development') {
  // Simulate WebSocket connection with mock data
  console.log('Development mode: Simulating WebSocket connection');
  
  // Simulate real-time updates
  setInterval(() => {
    // Simulate system stats updates
    const mockStats = {
      efficiency: 90 + Math.random() * 10,
      wasteProcessed: Math.floor(1200 + Math.random() * 100),
      contaminationRate: Math.random() * 5,
      carbonCredits: 150 + Math.random() * 20,
    };
    
    store.dispatch(updateSystemStats(mockStats));
  }, 10000); // Update every 10 seconds

  // Simulate occasional notifications
  setInterval(() => {
    const notifications = [
      {
        title: 'System Update',
        message: 'Sensor calibration completed successfully',
        type: 'success' as const,
        category: 'system' as const,
      },
      {
        title: 'Processing Alert',
        message: 'High volume processing detected',
        type: 'info' as const,
        category: 'system' as const,
      },
    ];
    
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    store.dispatch(addNotification({
      ...randomNotification,
      read: false,
    }));
  }, 30000); // Add notification every 30 seconds
} else {
  // In production, attempt to connect to actual WebSocket server
  websocketService.connect();
}

export default websocketService;