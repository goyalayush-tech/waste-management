import React from 'react';
import { Card, Button, Dropdown, Typography } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, FullscreenOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { DashboardWidget } from '../../store/slices/dashboardSlice';

const { Text } = Typography;

interface WidgetProps {
  widget: DashboardWidget;
  onEdit?: (widgetId: string) => void;
  onDelete?: (widgetId: string) => void;
  onFullscreen?: (widgetId: string) => void;
  children: React.ReactNode;
}

const Widget: React.FC<WidgetProps> = ({
  widget,
  onEdit,
  onDelete,
  onFullscreen,
  children,
}) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Widget',
      onClick: () => onEdit?.(widget.id),
    },
    {
      key: 'fullscreen',
      icon: <FullscreenOutlined />,
      label: 'Fullscreen',
      onClick: () => onFullscreen?.(widget.id),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Remove Widget',
      danger: true,
      onClick: () => onDelete?.(widget.id),
    },
  ];

  const getWidgetSize = () => {
    switch (widget.size) {
      case 'small':
        return { minHeight: '200px' };
      case 'medium':
        return { minHeight: '300px' };
      case 'large':
        return { minHeight: '400px' };
      default:
        return { minHeight: '200px' };
    }
  };

  return (
    <Card
      title={widget.title}
      size="small"
      style={{
        height: '100%',
        ...getWidgetSize(),
      }}
      extra={
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            style={{ color: '#8c8c8c' }}
          />
        </Dropdown>
      }
      bodyStyle={{
        height: 'calc(100% - 57px)',
        padding: '16px',
      }}
    >
      {children}
    </Card>
  );
};

export default Widget;