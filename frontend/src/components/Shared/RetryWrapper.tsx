import React, { useState, useCallback, useEffect } from 'react';
import { Button, Space, Typography, Progress } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import ErrorDisplay from './ErrorDisplay';
import LoadingSpinner from './LoadingSpinner';

const { Text } = Typography;

export interface RetryWrapperProps {
  children: React.ReactNode;
  onRetry: () => Promise<void>;
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
  loading?: boolean;
  error?: Error | string | null;
  retryText?: string;
  loadingText?: string;
  errorTitle?: string;
  showRetryCount?: boolean;
}

const RetryWrapper: React.FC<RetryWrapperProps> = ({
  children,
  onRetry,
  maxRetries = 3,
  retryDelay = 2000,
  autoRetry = false,
  loading = false,
  error = null,
  retryText = 'Retry',
  loadingText = 'Loading...',
  errorTitle,
  showRetryCount = true,
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryCount, maxRetries]);

  const handleAutoRetry = useCallback(() => {
    if (!autoRetry || retryCount >= maxRetries) {
      return;
    }

    setCountdown(retryDelay / 1000);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRetry, retryDelay, retryCount, maxRetries, handleRetry]);

  useEffect(() => {
    if (error && autoRetry && retryCount < maxRetries) {
      const cleanup = handleAutoRetry();
      return cleanup;
    }
  }, [error, handleAutoRetry, retryCount, maxRetries]);

  // Reset retry count when error is cleared
  useEffect(() => {
    if (!error) {
      setRetryCount(0);
      setCountdown(0);
    }
  }, [error]);

  if (loading || isRetrying) {
    return (
      <LoadingSpinner
        text={isRetrying ? 'Retrying...' : loadingText}
        size="large"
      />
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const canRetry = retryCount < maxRetries;

    return (
      <ErrorDisplay
        type="custom"
        title={errorTitle || 'Operation Failed'}
        message={errorMessage}
        showRetry={false}
        extra={
          <Space direction="vertical" align="center">
            {canRetry ? (
              <>
                <Space>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleRetry}
                    disabled={countdown > 0}
                  >
                    {retryText}
                  </Button>
                  {showRetryCount && (
                    <Text type="secondary">
                      ({retryCount}/{maxRetries} attempts)
                    </Text>
                  )}
                </Space>
                
                {countdown > 0 && (
                  <Space direction="vertical" align="center">
                    <Space>
                      <ClockCircleOutlined />
                      <Text type="secondary">
                        Auto-retry in {countdown} seconds
                      </Text>
                    </Space>
                    <Progress
                      percent={((retryDelay / 1000 - countdown) / (retryDelay / 1000)) * 100}
                      size="small"
                      showInfo={false}
                      style={{ width: '200px' }}
                    />
                  </Space>
                )}
              </>
            ) : (
              <Text type="danger">
                Maximum retry attempts reached ({maxRetries}/{maxRetries})
              </Text>
            )}
          </Space>
        }
      />
    );
  }

  return <>{children}</>;
};

export default RetryWrapper;