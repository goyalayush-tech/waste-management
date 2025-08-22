import React from 'react';
import { Typography, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const TestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Title level={1}>🌱 Advanced Waste Management System</Title>
      <Paragraph>
        Welcome to the test page! If you can see this, the basic routing and layout are working.
      </Paragraph>
      
      <Space direction="vertical" size="large">
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
        <Button onClick={() => navigate('/waste-analysis')}>
          Go to Waste Analysis
        </Button>
        <Button onClick={() => navigate('/contamination-detection')}>
          Go to Contamination Detection
        </Button>
      </Space>
    </div>
  );
};

export default TestPage;