import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export interface SharedButtonProps extends AntButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<SharedButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  children,
  style,
  ...props
}) => {
  const getButtonType = () => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'default';
      case 'success':
        return 'primary';
      case 'warning':
        return 'primary';
      case 'danger':
        return 'primary';
      case 'ghost':
        return 'ghost';
      default:
        return 'primary';
    }
  };

  const getButtonStyle = () => {
    const baseStyle: React.CSSProperties = {
      width: fullWidth ? '100%' : undefined,
      ...style,
    };

    switch (variant) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#52c41a',
          borderColor: '#52c41a',
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#faad14',
          borderColor: '#faad14',
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: '#f5222d',
          borderColor: '#f5222d',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <AntButton
      type={getButtonType()}
      style={getButtonStyle()}
      loading={loading}
      icon={loading ? <LoadingOutlined /> : props.icon}
      {...props}
    >
      {children}
    </AntButton>
  );
};

export default Button;