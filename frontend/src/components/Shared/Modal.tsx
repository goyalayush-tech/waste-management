import React from 'react';
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';
import { ExclamationCircleOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

export interface SharedModalProps extends AntModalProps {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

const Modal: React.FC<SharedModalProps> = ({
  variant = 'default',
  size = 'medium',
  children,
  title,
  ...props
}) => {
  const getModalWidth = () => {
    switch (size) {
      case 'small':
        return 400;
      case 'medium':
        return 600;
      case 'large':
        return 800;
      case 'fullscreen':
        return '100vw';
      default:
        return 600;
    }
  };

  const getModalStyle = () => {
    if (size === 'fullscreen') {
      return {
        top: 0,
        paddingBottom: 0,
        maxWidth: '100vw',
        height: '100vh',
      };
    }
    return {};
  };

  const getBodyStyle = () => {
    if (size === 'fullscreen') {
      return {
        height: 'calc(100vh - 110px)',
        overflow: 'auto',
      };
    }
    return {};
  };

  const getIcon = () => {
    switch (variant) {
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return null;
    }
  };

  const modalTitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {getIcon()}
      {title}
    </div>
  );

  return (
    <AntModal
      title={variant !== 'default' ? modalTitle : title}
      width={getModalWidth()}
      style={getModalStyle()}
      bodyStyle={getBodyStyle()}
      {...props}
    >
      {children}
    </AntModal>
  );
};

export default Modal;