import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { LineChartOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Analytics: React.FC = () => {
  return (
    <div>
      <Title level={2}>
        <LineChartOutlined /> Analytics Dashboard
      </Title>
      <Paragraph>
        Comprehensive analytics and reporting for waste management operations.
      </Paragraph>
      
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LineChartOutlined style={{ fontSize: '64px', color: '#13c2c2', marginBottom: '16px' }} />
          <Title level={3}>Advanced Analytics</Title>
          <Paragraph>
            This page will display comprehensive charts, reports, and insights about waste processing
            performance, environmental impact, and system efficiency.
          </Paragraph>
          <Space>
            <Button type="primary" icon={<ArrowRightOutlined />}>
              View Reports
            </Button>
            <Button icon={<ArrowRightOutlined />}>
              Generate Report
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;