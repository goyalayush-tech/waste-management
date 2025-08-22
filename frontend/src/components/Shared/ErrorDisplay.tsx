import React from 'react';
import { Result, Button, Alert, Card, Typography, Space } from 'antd';
import {
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DisconnectOutlined,
  LockOutlined,
  FileExclamationOutlined,
  ReloadOutlined,
  HomeOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export interface ErrorDisplayProps {
  type?: 'network' | 'auth' | 'permission' | 'notfound' | 'server' | 'validation' | 'custom';
  title?: string;
  message?: string;
  description?: string;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  extra?: React.ReactNode;
  style?: React.CSSProperties;
  size?: 'small' | 'default' | 'large';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'custom',
  title,
  message,
  description,
  showRetry = true,
  showHome = false,
  onRetry,
  onHome,
  extra,
  style,
  size = 'default',
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          status: 'error' as const,
          icon: <DisconnectOutlined />,
          title: title || 'Network Error',
          subTitle: message || 'Unable to connect to the server. Please check your internet connection.',
          description: description || 'This could be due to network connectivity issues or server maintenance.',
        };
      case 'auth':
        return {
          status: 'error' as const,
          icon: <LockOutlined />,
          title: title || 'Authentication Error',
          subTitle: message || 'You are not authorized to access this resource.',
          description: description || 'Please log in again or contact your administrator.',
        };
      case 'permission':
        return {
          status: '403' as const,
          icon: <LockOutlined />,
          title: title || 'Access Denied',
          subTitle: message || 'You do not have permission to access this resource.',
          description: description || 'Contact your administrator to request access.',
        };
      case 'notfound':
        return {
          status: '404' as const,
          icon: <FileExclamationOutlined />,
          title: title || 'Page Not Found',
          subTitle: message || 'The page you are looking for does not exist.',
          description: description || 'The URL may be incorrect or the page may have been moved.',
        };
      case 'server':
        return {
          status: '500' as const,
          icon: <ExclamationCircleOutlined />,
          title: title || 'Server Error',
          subTitle: message || 'An internal server error occurred.',
          description: description || 'Please try again later or contact support if the problem persists.',
        };
      case 'validation':
        return {
          status: 'warning' as const,
          icon: <WarningOutlined />,
          title: title || 'Validation Error',
          subTitle: message || 'Please check your input and try again.',
          description: description || 'Some required fields may be missing or contain invalid data.',
        };
      default:
        return {
          status: 'error' as const,
          icon: <CloseCircleOutlined />,
          title: title || 'Error',
          subTitle: message || 'An error occurred.',
          description: description || 'Please try again or contact support.',
        };
    }
  };

  const config = getErrorConfig();

  const getResultSize = () => {
    switch (size) {
      case 'small':
        return { padding: '20px' };
      case 'large':
        return { padding: '60px 40px' };
      default:
        return { padding: '40px' };
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = '/';
    }
  };

  const actions = [];

  if (showRetry) {
    actions.push(
      <Button key="retry" type="primary" onClick={handleRetry}>
        <ReloadOutlined /> Try Again
      </Button>
    );
  }

  if (showHome) {
    actions.push(
      <Button key="home" onClick={handleHome}>
        <HomeOutlined /> Go Home
      </Button>
    );
  }

  if (extra) {
    actions.push(extra);
  }

  // For small errors, use Alert instead of Result
  if (size === 'small') {
    return (
      <Alert
        message={config.title}
        description={config.subTitle}
        type={config.status === 'warning' ? 'warning' : 'error'}
        showIcon
        action={
          showRetry ? (
            <Button size="small" onClick={handleRetry}>
              <ReloadOutlined /> Retry
            </Button>
          ) : undefined
        }
        style={style}
      />
    );
  }

  return (
    <div style={{ ...getResultSize(), ...style }}>
      <Result
        status={config.status}
        icon={config.icon}
        title={config.title}
        subTitle={config.subTitle}
        extra={actions.length > 0 ? actions : undefined}
      >
        {config.description && (
          <Card size="small" style={{ marginTop: '24px', textAlign: 'left' }}>
            <Paragraph>
              <Text type="secondary">{config.description}</Text>
            </Paragraph>
          </Card>
        )}
      </Result>
    </div>
  );
};

export default ErrorDisplay;