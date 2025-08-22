import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { GlobalOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const DigitalTwins: React.FC = () => {
  return (
    <div>
      <Title level={2}>
        <GlobalOutlined /> Digital Twins
      </Title>
      <Paragraph>
        Real-time digital representations of waste processing systems and equipment.
      </Paragraph>
      
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <GlobalOutlined style={{ fontSize: '64px', color: '#13c2c2', marginBottom: '16px' }} />
          <Title level={3}>Digital Twin Ecosystem</Title>
          <Paragraph>
            This page will display digital twin visualizations, real-time synchronization status,
            and simulation results for waste processing systems.
          </Paragraph>
          <Space>
            <Button type="primary" icon={<ArrowRightOutlined />}>
              View Digital Twins
            </Button>
            <Button icon={<ArrowRightOutlined />}>
              Create New Twin
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default DigitalTwins;