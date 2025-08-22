import React from 'react';
import { Spin, Typography, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  text?: string;
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
  overlay?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  text,
  tip,
  spinning = true,
  children,
  overlay = false,
  delay = 0,
  style,
}) => {
  const customIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 24 : size === 'small' ? 14 : 20 }} spin />;

  const loadingContent = (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: children ? undefined : '200px',
        padding: '20px',
        ...style,
      }}
    >
      <Spin 
        size={size} 
        indicator={customIcon}
        spinning={spinning}
        delay={delay}
        tip={tip}
      >
        {children && (
          <div style={{ minHeight: '100px' }}>
            {children}
          </div>
        )}
      </Spin>
      {text && !tip && (
        <Space direction="vertical" align="center" style={{ marginTop: '16px' }}>
          <Text type="secondary">{text}</Text>
        </Space>
      )}
    </div>
  );

  if (overlay && children) {
    return (
      <div style={{ position: 'relative' }}>
        {children}
        {spinning && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <Spin size={size} indicator={customIcon} tip={tip || text} />
          </div>
        )}
      </div>
    );
  }

  return loadingContent;
};

export default LoadingSpinner;