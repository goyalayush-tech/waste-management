import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

export interface RealTimeDataConfig {
  widgetId: string;
  channel: string;
  refreshInterval?: number;
  autoSubscribe?: boolean;
}

export interface RealTimeDataState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isSubscribed: boolean;
}

export const useRealTimeData = <T = any>(config: RealTimeDataConfig) => {
  const { isConnected, subscribe } = useWebSocket();
  const [state, setState] = useState<RealTimeDataState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    isSubscribed: false,
  });

  const handleDataUpdate = useCallback((newData: T) => {
    setState(prevState => ({
      ...prevState,
      data: newData,
      loading: false,
      error: null,
      lastUpdated: new Date(),
    }));
  }, []);

  const handleError = useCallback((error: string) => {
    setState(prevState => ({
      ...prevState,
      loading: false,
      error,
    }));
  }, []);

  const subscribeToChannel = useCallback(() => {
    if (!isConnected || state.isSubscribed) return;

    setState(prevState => ({
      ...prevState,
      loading: true,
      error: null,
    }));

    const unsubscribe = subscribe(config.channel, (data) => {
      if (data.error) {
        handleError(data.error);
      } else {
        handleDataUpdate(data);
      }
    });

    setState(prevState => ({
      ...prevState,
      isSubscribed: true,
      loading: false,
    }));

    return unsubscribe;
  }, [isConnected, state.isSubscribed, config.channel, subscribe, handleDataUpdate, handleError]);

  const unsubscribeFromChannel = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isSubscribed: false,
      loading: false,
    }));
  }, []);

  const refreshData = useCallback(() => {
    if (!isConnected) return;

    setState(prevState => ({
      ...prevState,
      loading: true,
      error: null,
    }));

    // Request fresh data for this widget
    const { sendMessage } = useWebSocket();
    sendMessage({
      type: 'REQUEST_WIDGET_DATA',
      payload: {
        widgetId: config.widgetId,
        channel: config.channel,
      },
    });
  }, [isConnected, config.widgetId, config.channel]);

  // Auto-subscribe when connected
  useEffect(() => {
    if (config.autoSubscribe !== false && isConnected && !state.isSubscribed) {
      const unsubscribe = subscribeToChannel();
      return unsubscribe;
    }
  }, [isConnected, state.isSubscribed, config.autoSubscribe, subscribeToChannel]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (config.refreshInterval && config.refreshInterval > 0) {
      const interval = setInterval(refreshData, config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [config.refreshInterval, refreshData]);

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (state.isSubscribed) {
        unsubscribeFromChannel();
      }
    };
  }, [state.isSubscribed, unsubscribeFromChannel]);

  return {
    ...state,
    subscribe: subscribeToChannel,
    unsubscribe: unsubscribeFromChannel,
    refresh: refreshData,
    isConnected,
  };
};

export default useRealTimeData;