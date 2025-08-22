import React from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';

export interface SharedCardProps extends AntCardProps {
  variant?: 'default' | 'bordered' | 'shadow' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  interactive?: boolean;
}

const Card: React.FC<SharedCardProps> = ({
  variant = 'default',
  padding = 'medium',
  interactive = false,
  children,
  style,
  className,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle: React.CSSProperties = {
      ...style,
    };

    switch (variant) {
      case 'bordered':
        return {
          ...baseStyle,
          border: '2px solid #d9d9d9',
        };
      case 'shadow':
        return {
          ...baseStyle,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        };
      case 'elevated':
        return {
          ...baseStyle,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-2px)',
        };
      default:
        return baseStyle;
    }
  };

  const getBodyStyle = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: '12px' };
      case 'medium':
        return { padding: '24px' };
      case 'large':
        return { padding: '32px' };
      default:
        return { padding: '24px' };
    }
  };

  const cardClassName = `shared-card ${interactive ? 'interactive' : ''} ${className || ''}`;

  return (
    <AntCard
      style={getCardStyle()}
      bodyStyle={getBodyStyle()}
      className={cardClassName}
      hoverable={interactive}
      {...props}
    >
      {children}
    </AntCard>
  );
};

export default Card;