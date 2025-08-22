import React, { useState } from 'react';
import {
  Drawer,
  List,
  Typography,
  Badge,
  Button,
  Space,
  Tag,
  Divider,
  Empty,
  Avatar,
} from 'antd';
import {
  BellOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  category: 'system' | 'analysis' | 'contamination' | 'blockchain' | 'maintenance';
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Contamination Detected',
      message: 'Batch WB-2024-001 flagged for high contamination levels. Immediate attention required.',
      type: 'warning',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      category: 'contamination',
    },
    {
      id: '2',
      title: 'Analysis Complete',
      message: 'Multi-modal analysis for batch WB-2024-002 completed with 98.7% confidence.',
      type: 'success',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      read: false,
      category: 'analysis',
    },
    {
      id: '3',
      title: 'NFT Certificate Minted',
      message: 'New waste processing certificate #2847 successfully minted on blockchain.',
      type: 'success',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: true,
      category: 'blockchain',
    },
    {
      id: '4',
      title: 'System Maintenance',
      message: 'Scheduled maintenance for sensor calibration will begin at 2:00 AM tonight.',
      type: 'info',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      category: 'maintenance',
    },
    {
      id: '5',
      title: 'High Processing Volume',
      message: 'Daily processing volume exceeded 1000kg. System performance optimal.',
      type: 'info',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
      category: 'system',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contamination':
        return '#f5222d';
      case 'analysis':
        return '#1890ff';
      case 'blockchain':
        return '#722ed1';
      case 'maintenance':
        return '#faad14';
      case 'system':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif =>
    filter === 'all' || !notif.read
  );

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <Drawer
      title={
        <Space>
          <BellOutlined />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" />
          )}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      extra={
        <Space>
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Button
            type={filter === 'all' ? 'primary' : 'default'}
            size="small"
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            type={filter === 'unread' ? 'primary' : 'default'}
            size="small"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {filteredNotifications.length === 0 ? (
        <Empty
          description={
            filter === 'unread' ? 'No unread notifications' : 'No notifications'
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={filteredNotifications}
          renderItem={(notification) => (
            <List.Item
              style={{
                padding: '12px 0',
                backgroundColor: notification.read ? 'transparent' : '#f6ffed',
                borderRadius: '4px',
                marginBottom: '8px',
                paddingLeft: notification.read ? '0' : '8px',
                borderLeft: notification.read ? 'none' : '3px solid #52c41a',
              }}
              actions={[
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => deleteNotification(notification.id)}
                  danger
                />,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size="small"
                    icon={getNotificationIcon(notification.type)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                    }}
                  />
                }
                title={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      strong={!notification.read}
                      style={{
                        cursor: 'pointer',
                        flex: 1,
                      }}
                      onClick={() => markAsRead(notification.id)}
                    >
                      {notification.title}
                    </Text>
                    <Tag
                      color={getCategoryColor(notification.category)}
                      style={{ fontSize: '10px', marginLeft: '8px' }}
                    >
                      {notification.category.toUpperCase()}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: '12px',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {notification.message}
                    </Text>
                    <Text
                      type="secondary"
                      style={{ fontSize: '11px' }}
                    >
                      {formatTimestamp(notification.timestamp)}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

export default NotificationCenter;