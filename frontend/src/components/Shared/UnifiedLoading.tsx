import React from 'react';
import { Result, Spin, Alert, Space, Typography, Button } from 'antd';
import { 
  LoadingOutlined, 
  ExclamationCircleOutlined, 
  InboxOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import Card from './Card';

const { Text } = Typography;

export interface UnifiedLoadingProps {
  loading?: boolean;
  error?: Error | null;
  data?: any;
  children?: React.ReactNode;
  
  // Customization options
  loadingText?: string;
  loadingSize?: 'small' | 'default' | 'large';
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  
  // Layout options
  minHeight?: number | string;
  variant?: 'card' | 'inline' | 'fullscreen';
  
  // Conditional rendering
  isEmpty?: (data: any) => boolean;
}

const defaultIsEmpty = (data: any): boolean => {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') return Object.keys(data).length === 0;
  return false;
};

const UnifiedLoading: React.FC<UnifiedLoadingProps> = ({
  loading = false,
  error = null,
  data,
  children,
  loadingText = 'Loading...',
  loadingSize = 'default',
  emptyTitle = 'No Data Available',
  emptyDescription = 'There is no data to display at the moment.',
  emptyIcon = <InboxOutlined />,
  errorTitle = 'Something went wrong',
  errorDescription,
  showRetry = true,
  onRetry,
  minHeight = 200,
  variant = 'inline',
  isEmpty = defaultIsEmpty,
}) => {
  const containerStyle: React.CSSProperties = {
    minHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  // Loading state
  if (loading) {
    const loadingContent = (
      <div style={containerStyle} className="unified-loading-container">
        <Space direction="vertical" align="center" size="middle">
          <Spin 
            size={loadingSize} 
            indicator={<LoadingOutlined style={{ fontSize: loadingSize === 'large' ? 24 : 16 }} spin />}
          />
          <Text type="secondary">{loadingText}</Text>
        </Space>
      </div>
    );

    if (variant === 'card') {
      return <Card variant="bordered">{loadingContent}</Card>;
    }
    
    if (variant === 'fullscreen') {
      return (
        <div style={{ ...containerStyle, height: '50vh' }} className="unified-loading-fullscreen">
          {loadingContent}
        </div>
      );
    }
    
    return loadingContent;
  }

  // Error state
  if (error) {
    const errorActions = showRetry && onRetry ? [
      <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
        Try Again
      </Button>
    ] : undefined;

    const errorContent = (
      <div style={containerStyle} className="unified-loading-error">
        <Result
          status="error"
          icon={<ExclamationCircleOutlined />}
          title={errorTitle}
          subTitle={errorDescription || error.message || 'An unexpected error occurred'}
          extra={errorActions}
        />
      </div>
    );

    if (variant === 'card') {
      return <Card variant="bordered">{errorContent}</Card>;
    }
    
    if (variant === 'fullscreen') {
      return (
        <div style={{ ...containerStyle, height: '50vh' }} className="unified-loading-error-fullscreen">
          {errorContent}
        </div>
      );
    }
    
    return errorContent;
  }

  // Empty state
  if (isEmpty(data)) {
    const emptyContent = (
      <div style={containerStyle} className="unified-loading-empty">
        <Result
          icon={emptyIcon}
          title={emptyTitle}
          subTitle={emptyDescription}
        />
      </div>
    );

    if (variant === 'card') {
      return <Card variant="bordered">{emptyContent}</Card>;
    }
    
    if (variant === 'fullscreen') {
      return (
        <div style={{ ...containerStyle, height: '50vh' }} className="unified-loading-empty-fullscreen">
          {emptyContent}
        </div>
      );
    }
    
    return emptyContent;
  }

  // Success state - render children
  return <>{children}</>;
};

export default UnifiedLoading;