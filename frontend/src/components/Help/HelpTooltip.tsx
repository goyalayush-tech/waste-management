import React from 'react';
import { Tooltip, Button, Typography } from 'antd';
import { QuestionCircleOutlined, InfoCircleOutlined, BulbOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface HelpTooltipProps {
  title: string;
  content: React.ReactNode;
  type?: 'info' | 'tip' | 'warning';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  trigger?: 'hover' | 'click' | 'focus';
  size?: 'small' | 'default' | 'large';
  showIcon?: boolean;
  children?: React.ReactNode;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  content,
  type = 'info',
  placement = 'top',
  trigger = 'hover',
  size = 'default',
  showIcon = true,
  children,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'tip':
        return <BulbOutlined style={{ color: '#faad14' }} />;
      case 'warning':
        return <InfoCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return <QuestionCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: '12px' };
      case 'large':
        return { fontSize: '18px' };
      default:
        return { fontSize: '14px' };
    }
  };

  const tooltipContent = (
    <div style={{ maxWidth: '300px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
        {title}
      </div>
      <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
        {content}
      </div>
    </div>
  );

  if (children) {
    return (
      <Tooltip
        title={tooltipContent}
        placement={placement}
        trigger={trigger}
        overlayStyle={{ maxWidth: '350px' }}
      >
        {children}
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={tooltipContent}
      placement={placement}
      trigger={trigger}
      overlayStyle={{ maxWidth: '350px' }}
    >
      <Button
        type="text"
        size="small"
        icon={showIcon ? getIcon() : undefined}
        style={{
          padding: '0 4px',
          height: 'auto',
          minWidth: 'auto',
          ...getIconSize(),
        }}
      />
    </Tooltip>
  );
};

export default HelpTooltip;