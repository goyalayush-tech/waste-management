import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

export interface AsyncOperationOptions {
  successMessage?: string;
  errorMessage?: string;
  autoRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  showMessages?: boolean;
}

export interface AsyncOperationResult<T> extends AsyncOperationState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  retry: () => Promise<T | null>;
  isStale: (maxAge: number) => boolean;
}

const DEFAULT_OPTIONS: Required<AsyncOperationOptions> = {
  successMessage: '',
  errorMessage: 'Operation failed',
  autoRetry: false,
  retryDelay: 1000,
  maxRetries: 3,
  showMessages: true,
};

export function useAsyncOperation<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: AsyncOperationOptions = {}
): AsyncOperationResult<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });
  
  const lastArgsRef = useRef<any[]>([]);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    if (!mountedRef.current) return null;
    
    lastArgsRef.current = args;
    retryCountRef.current = 0;
    
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));
    
    try {
      const result = await asyncFunction(...args);
      
      if (!mountedRef.current) return null;
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
      
      if (opts.showMessages && opts.successMessage) {
        message.success(opts.successMessage);
      }
      
      return result;
    } catch (error) {
      console.error('Async operation failed:', error);
      
      if (!mountedRef.current) return null;
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj,
      }));
      
      if (opts.showMessages) {
        message.error(opts.errorMessage);
      }
      
      // Auto retry logic
      if (opts.autoRetry && retryCountRef.current < opts.maxRetries) {
        retryCountRef.current++;
        setTimeout(() => {
          if (mountedRef.current) {
            execute(...args);
          }
        }, opts.retryDelay);
      }
      
      return null;
    }
  }, [asyncFunction, opts]);
  
  const retry = useCallback(async (): Promise<T | null> => {
    return execute(...lastArgsRef.current);
  }, [execute]);
  
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });
    retryCountRef.current = 0;
  }, []);
  
  const isStale = useCallback((maxAge: number): boolean => {
    if (!state.lastUpdated) return true;
    return Date.now() - state.lastUpdated.getTime() > maxAge;
  }, [state.lastUpdated]);
  
  return {
    ...state,
    execute,
    retry,
    reset,
    isStale,
  };
}

export default useAsyncOperation;