import React from 'react';
import { Badge, Tooltip, Space, Typography, Button } from 'antd';
import { 
  WifiOutlined, 
  DisconnectOutlined, 
  LoadingOutlined, 
  ExclamationCircleOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { useWebSocket } from '../../hooks/useWebSocket';

const { Text } = Typography;

const ConnectionStatus: React.FC = () => {
  const { 
    connectionState, 
    isConnected, 
    isConnecting, 
    isReconnecting, 
    hasError, 
    reconnectAttempts, 
    lastConnected, 
    error,
    reconnect 
  } = useWebSocket();

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'CONNECTED':
        return {
          status: 'success' as const,
          icon: <WifiOutlined />,
          text: 'Connected',
          color: '#52c41a',
        };
      case 'CONNECTING':
        return {
          status: 'processing' as const,
          icon: <LoadingOutlined spin />,
          text: 'Connecting',
          color: '#1890ff',
        };
      case 'RECONNECTING':
        return {
          status: 'processing' as const,
          icon: <LoadingOutlined spin />,
          text: `Reconnecting (${reconnectAttempts})`,
          color: '#faad14',
        };
      case 'ERROR':
        return {
          status: 'error' as const,
          icon: <ExclamationCircleOutlined />,
          text: 'Error',
          color: '#f5222d',
        };
      case 'DISCONNECTED':
        return {
          status: 'error' as const,
          icon: <DisconnectOutlined />,
          text: 'Disconnected',
          color: '#f5222d',
        };
      default:
        return {
          status: 'default' as const,
          icon: <DisconnectOutlined />,
          text: 'Unknown',
          color: '#d9d9d9',
        };
    }
  };

  const config = getStatusConfig();

  const getTooltipContent = () => {
    let content = `Real-time connection: ${config.text}`;
    
    if (lastConnected) {
      content += `\nLast connected: ${lastConnected.toLocaleTimeString()}`;
    }
    
    if (reconnectAttempts > 0) {
      content += `\nReconnect attempts: ${reconnectAttempts}`;
    }
    
    if (error) {
      content += `\nError: ${error}`;
    }
    
    return content;
  };

  return (
    <Tooltip title={getTooltipContent()}>
      <Space size={4}>
        <Badge status={config.status} />
        <span style={{ color: config.color, fontSize: '14px' }}>
          {config.icon}
        </span>
        <Text style={{ color: config.color, fontSize: '12px' }}>
          {config.text}
        </Text>
        {(hasError || connectionState === 'DISCONNECTED') && (
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={reconnect}
            style={{ 
              color: config.color, 
              padding: '0 4px',
              height: '16px',
              minWidth: '16px'
            }}
            title="Reconnect"
          />
        )}
      </Space>
    </Tooltip>
  );
};

export default ConnectionStatus;