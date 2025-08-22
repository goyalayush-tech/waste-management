import { useEffect, useState, useCallback } from 'react';
import { websocketService, WebSocketMessage, ConnectionStatus } from '../services/websocketService';

export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    state: 'DISCONNECTED',
    reconnectAttempts: 0,
  });
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    // Update connection status periodically
    const interval = setInterval(() => {
      setConnectionStatus(websocketService.getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    };
    websocketService.send(fullMessage);
  }, []);

  const connect = useCallback((url?: string) => {
    return websocketService.connect(url);
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    websocketService.reconnect();
  }, []);

  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    websocketService.subscribe(channel, callback);
    
    // Return unsubscribe function
    return () => {
      websocketService.unsubscribe(channel);
    };
  }, []);

  return {
    connectionStatus,
    connectionState: connectionStatus.state,
    isConnected: connectionStatus.state === 'CONNECTED',
    isConnecting: connectionStatus.state === 'CONNECTING',
    isReconnecting: connectionStatus.state === 'RECONNECTING',
    hasError: connectionStatus.state === 'ERROR',
    reconnectAttempts: connectionStatus.reconnectAttempts,
    lastConnected: connectionStatus.lastConnected,
    error: connectionStatus.error,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnect,
    subscribe,
  };
};

export default useWebSocket;