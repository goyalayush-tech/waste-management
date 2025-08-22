import React, { useState, useEffect } from 'react';
import {
  Card,
  Switch,
  List,
  Typography,
  Space,
  Button,
  Alert,
  Divider,
  Tag,
  message,
} from 'antd';
import {
  BellOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  BlockOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { usePushNotifications } from '../../utils/pushNotifications';

const { Title, Text, Paragraph } = Typography;

interface NotificationSettingsProps {
  onSettingsChange?: (settings: NotificationSettings) => void;
}

interface NotificationSettings {
  enabled: boolean;
  wasteAnalysis: boolean;
  contamination: boolean;
  certificates: boolean;
  systemAlerts: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onSettingsChange,
}) => {
  const {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    showWasteAnalysisComplete,
    showContaminationAlert,
    showSystemAlert,
    showCertificateGenerated,
  } = usePushNotifications();

  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    wasteAnalysis: true,
    contamination: true,
    certificates: true,
    systemAlerts: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }

    // Update enabled state based on subscription
    setSettings(prev => ({
      ...prev,
      enabled: !!subscription && permission === 'granted',
    }));
  }, [subscription, permission]);

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
    onSettingsChange?.(newSettings);
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      if (settings.enabled) {
        // Disable notifications
        const success = await unsubscribe();
        if (success) {
          saveSettings({ ...settings, enabled: false });
          message.success('Push notifications disabled');
        } else {
          message.error('Failed to disable notifications');
        }
      } else {
        // Enable notifications
        const newPermission = await requestPermission();
        if (newPermission === 'granted') {
          const newSubscription = await subscribe();
          if (newSubscription) {
            saveSettings({ ...settings, enabled: true });
            message.success('Push notifications enabled');
          } else {
            message.error('Failed to enable notifications');
          }
        } else {
          message.warning('Notification permission denied');
        }
      }
    } catch (error) {
      console.error('Error managing notifications:', error);
      message.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const testNotification = async (type: string) => {
    try {
      switch (type) {
        case 'analysis':
          await showWasteAnalysisComplete('TEST-001', { classification: 'Organic', confidence: 95.2 });
          break;
        case 'contamination':
          await showContaminationAlert('TEST-002', 'Heavy Metal');
          break;
        case 'certificate':
          await showCertificateGenerated('CERT-12345');
          break;
        case 'system':
          await showSystemAlert('System maintenance scheduled for tonight at 2 AM', 'info');
          break;
        default:
          await showNotification({
            title: 'Test Notification',
            body: 'This is a test notification from the Waste Management System',
          });
      }
      message.success('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      message.error('Failed to send test notification');
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return <Tag color="success" icon={<CheckCircleOutlined />}>Granted</Tag>;
      case 'denied':
        return <Tag color="error" icon={<CloseCircleOutlined />}>Denied</Tag>;
      default:
        return <Tag color="warning" icon={<WarningOutlined />}>Not Requested</Tag>;
    }
  };

  const getSubscriptionStatus = () => {
    if (subscription) {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>;
    }
    return <Tag color="default" icon={<CloseCircleOutlined />}>Inactive</Tag>;
  };

  if (!isSupported) {
    return (
      <Card>
        <Alert
          message="Push Notifications Not Supported"
          description="Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari."
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  const notificationTypes = [
    {
      key: 'wasteAnalysis',
      title: 'Waste Analysis Results',
      description: 'Get notified when waste analysis is complete',
      icon: <ExperimentOutlined style={{ color: '#1890ff' }} />,
      testType: 'analysis',
    },
    {
      key: 'contamination',
      title: 'Contamination Alerts',
      description: 'Receive alerts for contamination detection',
      icon: <SafetyCertificateOutlined style={{ color: '#f5222d' }} />,
      testType: 'contamination',
    },
    {
      key: 'certificates',
      title: 'Certificate Updates',
      description: 'Notifications for blockchain certificate generation',
      icon: <BlockOutlined style={{ color: '#722ed1' }} />,
      testType: 'certificate',
    },
    {
      key: 'systemAlerts',
      title: 'System Alerts',
      description: 'Important system notifications and maintenance updates',
      icon: <WarningOutlined style={{ color: '#faad14' }} />,
      testType: 'system',
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={4}>
            <BellOutlined /> Push Notification Settings
          </Title>
          <Paragraph type="secondary">
            Configure push notifications to stay updated on important system events.
          </Paragraph>
        </div>

        {/* Status Information */}
        <Card size="small" style={{ backgroundColor: '#fafafa' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Permission Status:</Text>
              {getPermissionStatus()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Subscription Status:</Text>
              {getSubscriptionStatus()}
            </div>
          </Space>
        </Card>

        {/* Master Enable/Disable */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>Enable Push Notifications</Text>
            <br />
            <Text type="secondary">
              {settings.enabled 
                ? 'You will receive push notifications for selected events'
                : 'Enable to receive push notifications'
              }
            </Text>
          </div>
          <Switch
            checked={settings.enabled}
            onChange={handleEnableNotifications}
            loading={loading}
            size="default"
          />
        </div>

        <Divider />

        {/* Individual Notification Types */}
        <div>
          <Title level={5}>Notification Types</Title>
          <List
            dataSource={notificationTypes}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Switch
                    key="switch"
                    checked={settings[item.key as keyof NotificationSettings] as boolean}
                    onChange={(checked) => handleSettingChange(item.key as keyof NotificationSettings, checked)}
                    disabled={!settings.enabled}
                    size="small"
                  />,
                  <Button
                    key="test"
                    size="small"
                    type="text"
                    onClick={() => testNotification(item.testType)}
                    disabled={!settings.enabled || !(settings[item.key as keyof NotificationSettings] as boolean)}
                  >
                    Test
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={item.icon}
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </div>

        {/* Help Text */}
        <Alert
          message="About Push Notifications"
          description={
            <div>
              <p>Push notifications work even when the app is closed or in the background.</p>
              <p>You can change these settings at any time in your browser or device settings.</p>
              <p>Notifications are sent securely and your privacy is protected.</p>
            </div>
          }
          type="info"
          showIcon
        />
      </Space>
    </Card>
  );
};

export default NotificationSettings;