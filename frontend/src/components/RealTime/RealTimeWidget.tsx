import React, { ReactNode } from 'react';
import { Spin, Alert, Typography } from 'antd';
import { ReloadOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useRealTimeData, RealTimeDataConfig } from '../../hooks/useRealTimeData';

const { Text } = Typography;

export interface RealTimeWidgetProps extends RealTimeDataConfig {
  children: (data: any, actions: {
    refresh: () => void;
    subscribe: () => void;
    unsubscribe: () => void;
  }) => ReactNode;
  fallbackComponent?: ReactNode;
  showConnectionStatus?: boolean;
  showLastUpdated?: boolean;
}

const RealTimeWidget: React.FC<RealTimeWidgetProps> = ({
  children,
  fallbackComponent,
  showConnectionStatus = true,
  showLastUpdated = true,
  ...config
}) => {
  const {
    data,
    loading,
    error,
    lastUpdated,
    isSubscribed,
    isConnected,
    subscribe,
    unsubscribe,
    refresh,
  } = useRealTimeData(config);

  const actions = {
    refresh,
    subscribe,
    unsubscribe,
  };

  if (loading && !data) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Real-time Data Error"
        description={error}
        type="error"
        showIcon
        action={
          <ReloadOutlined 
            onClick={refresh} 
            style={{ cursor: 'pointer' }}
            title="Retry"
          />
        }
      />
    );
  }

  if (!data && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Connection and update status */}
      {(showConnectionStatus || showLastUpdated) && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '12px',
          color: '#666',
        }}>
          {showConnectionStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {isConnected ? (
                <WifiOutlined style={{ color: '#52c41a' }} />
              ) : (
                <DisconnectOutlined style={{ color: '#f5222d' }} />
              )}
              <Text style={{ fontSize: '11px' }}>
                {isSubscribed ? 'Live' : 'Static'}
              </Text>
            </div>
          )}
          
          {showLastUpdated && lastUpdated && (
            <Text style={{ fontSize: '11px' }}>
              {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
          
          {loading && (
            <Spin size="small" />
          )}
        </div>
      )}
      
      {/* Widget content */}
      {children(data, actions)}
    </div>
  );
};

export default RealTimeWidget;