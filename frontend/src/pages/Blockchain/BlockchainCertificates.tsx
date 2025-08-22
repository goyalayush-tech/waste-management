import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { BlockOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const BlockchainCertificates: React.FC = () => {
  return (
    <div>
      <Title level={2}>
        <BlockOutlined /> Blockchain Certificates
      </Title>
      <Paragraph>
        NFT-based waste processing certificates with immutable proof of environmental impact.
      </Paragraph>
      
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <BlockOutlined style={{ fontSize: '64px', color: '#722ed1', marginBottom: '16px' }} />
          <Title level={3}>Blockchain Integration</Title>
          <Paragraph>
            This page will display NFT certificates, digital twins, and blockchain transaction history.
            The blockchain services are already implemented and ready for integration.
          </Paragraph>
          <Space>
            <Button type="primary" icon={<ArrowRightOutlined />}>
              View Certificates
            </Button>
            <Button icon={<ArrowRightOutlined />}>
              Mint New Certificate
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default BlockchainCertificates;