import React from 'react';
import { Row, Col, Statistic, Typography, Progress, Alert } from 'antd';
import Card from '../../components/Shared/Card';
import ErrorBoundary from '../../components/Shared/ErrorBoundary';
import { RESPONSIVE_CONFIGS } from '../../utils/responsive';
import '../shared-styles.css';
import {
  ExperimentOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="tool-page">
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>System Dashboard</Title>
        <Text type="secondary">
          Welcome to the Advanced Waste Management System - Your AI-powered, blockchain-enabled waste processing platform
        </Text>
      </div>

      <Alert
        message="System Status: Operational"
        description="All systems are running optimally. Multi-modal sensors calibrated, AI models active, blockchain connected."
        type="success"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col {...RESPONSIVE_CONFIGS.metrics}>
          <Card variant="shadow" interactive>
            <Statistic
              title="System Efficiency"
              value={94.2}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<ThunderboltOutlined />}
            />
            <Progress percent={94.2} size="small" showInfo={false} />
          </Card>
        </Col>
        
        <Col {...RESPONSIVE_CONFIGS.metrics}>
          <Card variant="shadow" interactive>
            <Statistic
              title="Waste Processed Today"
              value={1247}
              suffix="kg"
              prefix={<ExperimentOutlined />}
            />
            <Progress percent={78} size="small" showInfo={false} />
          </Card>
        </Col>
        
        <Col {...RESPONSIVE_CONFIGS.metrics}>
          <Card variant="shadow" interactive>
            <Statistic
              title="Contamination Rate"
              value={2.3}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
              prefix={<SafetyCertificateOutlined />}
            />
            <Progress percent={2.3} size="small" status="exception" showInfo={false} />
          </Card>
        </Col>
        
        <Col {...RESPONSIVE_CONFIGS.metrics}>
          <Card variant="shadow" interactive>
            <Statistic
              title="Carbon Credits Generated"
              value={156.7}
              suffix="tons CO₂"
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
            />
            <Progress percent={85} size="small" showInfo={false} />
          </Card>
        </Col>
      </Row>

      {/* Feature Cards */}
      <Row gutter={[16, 16]}>
        <Col {...RESPONSIVE_CONFIGS.features}>
          <Card
            title="Multi-Modal Analysis"
            extra={<ExperimentOutlined style={{ color: '#1890ff' }} />}
            variant="elevated"
            interactive
          >
            <Text>
              Advanced AI-powered waste classification using visual, spectral, weight, and chemical sensors
              achieving 98%+ accuracy through sensor fusion.
            </Text>
            <div style={{ marginTop: '16px' }}>
              <Text strong>Status: </Text>
              <Text type="success">Active</Text>
            </div>
          </Card>
        </Col>
        
        <Col {...RESPONSIVE_CONFIGS.features}>
          <Card
            title="Contamination Detection"
            extra={<SafetyCertificateOutlined style={{ color: '#52c41a' }} />}
            variant="elevated"
            interactive
          >
            <Text>
              Real-time contamination detection in recyclable streams with automated flagging
              and AI-powered remediation suggestions.
            </Text>
            <div style={{ marginTop: '16px' }}>
              <Text strong>Flagged Batches: </Text>
              <Text type="warning">3 pending</Text>
            </div>
          </Card>
        </Col>
        
        <Col {...RESPONSIVE_CONFIGS.features}>
          <Card
            title="Autonomous Processing"
            extra={<RobotOutlined style={{ color: '#faad14' }} />}
            variant="elevated"
            interactive
          >
            <Text>
              AI-controlled equipment with reinforcement learning agents optimizing
              processing parameters in real-time.
            </Text>
            <div style={{ marginTop: '16px' }}>
              <Text strong>Autonomous Units: </Text>
              <Text type="success">12/15 active</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col {...RESPONSIVE_CONFIGS.features}>
          <Card
            title="NFT Certificates"
            extra={<SafetyCertificateOutlined style={{ color: '#722ed1' }} />}
            variant="elevated"
            interactive
          >
            <Text>
              Blockchain-based waste processing certificates with immutable proof
              of environmental impact and recycling achievements.
            </Text>
            <div style={{ marginTop: '16px' }}>
              <Text strong>Certificates Minted: </Text>
              <Text type="success">2,847</Text>
            </div>
          </Card>
        </Col>
        
        <Col {...RESPONSIVE_CONFIGS.features}>
          <Card
            title="DeFi Marketplace"
            extra={<DollarOutlined style={{ color: '#13c2c2' }} />}
            variant="elevated"
            interactive
          >
            <Text>
              Trade tokenized carbon credits, stake environmental tokens,
              and participate in yield farming protocols.
            </Text>
            <div style={{ marginTop: '16px' }}>
              <Text strong>TVL: </Text>
              <Text type="success">$2.4M</Text>
            </div>
          </Card>
        </Col>
        
        <Col {...RESPONSIVE_CONFIGS.features}>
          <Card
            title="Metaverse Integration"
            extra={<GlobalOutlined style={{ color: '#eb2f96' }} />}
            variant="elevated"
            interactive
          >
            <Text>
              Virtual waste management facilities with gamified experiences
              and educational content in immersive 3D environments.
            </Text>
            <div style={{ marginTop: '16px' }}>
              <Text strong>Active Users: </Text>
              <Text type="success">1,234</Text>
            </div>
          </Card>
        </Col>
      </Row>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;