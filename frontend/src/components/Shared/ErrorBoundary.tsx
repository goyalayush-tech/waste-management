import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Card, Space } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  BugOutlined,
  HomeOutlined 
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{ padding: '40px', minHeight: '400px' }}>
          <Result
            status="error"
            icon={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
            title="Something went wrong"
            subTitle="An unexpected error occurred. Please try refreshing the page or contact support if the problem persists."
            extra={[
              <Button type="primary" key="retry" onClick={this.handleRetry}>
                <ReloadOutlined /> Try Again
              </Button>,
              <Button key="reload" onClick={this.handleReload}>
                <ReloadOutlined /> Reload Page
              </Button>,
              <Button key="home" onClick={this.handleGoHome}>
                <HomeOutlined /> Go Home
              </Button>,
            ]}
          >
            {this.props.showDetails && this.state.error && (
              <Card 
                title={
                  <Space>
                    <BugOutlined />
                    Error Details
                  </Space>
                }
                style={{ marginTop: '24px', textAlign: 'left' }}
                size="small"
              >
                <Paragraph>
                  <Text strong>Error Message:</Text>
                  <br />
                  <Text code>{this.state.error.message}</Text>
                </Paragraph>
                
                {this.state.error.stack && (
                  <Paragraph>
                    <Text strong>Stack Trace:</Text>
                    <br />
                    <Text code style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                      {this.state.error.stack}
                    </Text>
                  </Paragraph>
                )}
                
                {this.state.errorInfo?.componentStack && (
                  <Paragraph>
                    <Text strong>Component Stack:</Text>
                    <br />
                    <Text code style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </Paragraph>
                )}
              </Card>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;