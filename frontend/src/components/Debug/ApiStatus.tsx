// API Status Debug Component
import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Space, Typography, Divider, Switch } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  LoadingOutlined,
  ApiOutlined,
  BugOutlined
} from '@ant-design/icons';
import { apiClientFactory, devApiControls } from '../../services/api';

const { Text, Title } = Typography;

interface ServiceStatus {
  status: 'ok' | 'error' | 'loading';
  message?: string;
}

interface ApiStatusState {
  ai: ServiceStatus;
  epr: ServiceStatus;
  blockchain: ServiceStatus;
  auth: ServiceStatus;
}

const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<ApiStatusState>({
    ai: { status: 'loading' },
    epr: { status: 'loading' },
    blockchain: { status: 'loading' },
    auth: { status: 'loading' },
  });
  
  const [config, setConfig] = useState(apiClientFactory.getConfig());
  const [isVisible, setIsVisible] = useState(process.env.NODE_ENV === 'development');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setStatus({
      ai: { status: 'loading' },
      epr: { status: 'loading' },
      blockchain: { status: 'loading' },
      auth: { status: 'loading' },
    });

    try {
      const healthResults = await devApiControls.healthCheck();
      setStatus(healthResults);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const toggleMock = (service: 'ai' | 'epr' | 'blockchain' | 'auth', enabled: boolean) => {
    apiClientFactory.toggleMockMode(service, enabled);
    setConfig(apiClientFactory.getConfig());
    // Recheck health after toggling
    setTimeout(checkHealth, 100);
  };

  const getStatusIcon = (serviceStatus: ServiceStatus) => {
    switch (serviceStatus.status) {
      case 'ok':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      case 'loading':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getStatusColor = (serviceStatus: ServiceStatus) => {
    switch (serviceStatus.status) {
      case 'ok':
        return 'success';
      case 'error':
        return 'error';
      case 'loading':
        return 'processing';
    }
  };

  if (!isVisible) {
    return (
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Button
          type="primary"
          icon={<BugOutlined />}
          onClick={() => setIsVisible(true)}
          size="small"
        >
          API Debug
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      width: 400, 
      zIndex: 1000,
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <Card
        title={
          <Space>
            <ApiOutlined />
            API Status & Controls
          </Space>
        }
        size="small"
        extra={
          <Button 
            type="text" 
            size="small" 
            onClick={() => setIsVisible(false)}
          >
            ×
          </Button>
        }
        style={{ 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #d9d9d9'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Button 
              type="primary" 
              size="small" 
              onClick={checkHealth}
              loading={Object.values(status).some(s => s.status === 'loading')}
            >
              Refresh Status
            </Button>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* Service Status */}
          <div>
            <Text strong>Service Health:</Text>
            <div style={{ marginTop: 8 }}>
              {Object.entries(status).map(([service, serviceStatus]) => (
                <div key={service} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 4
                }}>
                  <Space>
                    {getStatusIcon(serviceStatus)}
                    <Text>{service.toUpperCase()}</Text>
                  </Space>
                  <Tag color={getStatusColor(serviceStatus)}>
                    {serviceStatus.status}
                  </Tag>
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* Mock Controls */}
          <div>
            <Text strong>Mock Mode Controls:</Text>
            <div style={{ marginTop: 8 }}>
              {[
                { key: 'ai' as const, label: 'AI Services', enabled: config.useMockAi },
                { key: 'epr' as const, label: 'EPR Services', enabled: config.useMockEpr },
                { key: 'blockchain' as const, label: 'Blockchain', enabled: config.useMockBlockchain },
                { key: 'auth' as const, label: 'Auth', enabled: config.useMockAuth },
              ].map(({ key, label, enabled }) => (
                <div key={key} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Text>{label}:</Text>
                  <Switch
                    size="small"
                    checked={enabled}
                    onChange={(checked) => toggleMock(key, checked)}
                    checkedChildren="Mock"
                    unCheckedChildren="Real"
                  />
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* Quick Actions */}
          <div>
            <Text strong>Quick Actions:</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                <Button 
                  size="small" 
                  onClick={devApiControls.enableAllMocks}
                >
                  All Mock
                </Button>
                <Button 
                  size="small" 
                  onClick={devApiControls.disableAllMocks}
                >
                  All Real
                </Button>
              </Space>
            </div>
          </div>

          {/* Configuration Info */}
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text strong>Configuration:</Text>
            <div style={{ marginTop: 4, fontSize: '11px' }}>
              <div>Timeout: {config.timeout}ms</div>
              <div>Retries: {config.retries}</div>
              <div>Environment: {process.env.NODE_ENV}</div>
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default ApiStatus;