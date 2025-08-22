import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { SettingOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Settings: React.FC = () => {
  return (
    <div>
      <Title level={2}>
        <SettingOutlined /> System Settings
      </Title>
      <Paragraph>
        Configure system preferences, user settings, and application parameters.
      </Paragraph>
      
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <SettingOutlined style={{ fontSize: '64px', color: '#faad14', marginBottom: '16px' }} />
          <Title level={3}>Configuration Panel</Title>
          <Paragraph>
            This page will provide settings for user preferences, system configuration,
            sensor calibration, and integration parameters.
          </Paragraph>
          <Space>
            <Button type="primary" icon={<ArrowRightOutlined />}>
              User Settings
            </Button>
            <Button icon={<ArrowRightOutlined />}>
              System Config
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Settings;