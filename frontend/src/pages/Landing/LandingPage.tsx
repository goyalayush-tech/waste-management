import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Row,
  Col,
  Card,
  Button,
  Statistic,
  Typography,
  Space,
  Badge,
  Progress,
  Alert,
  Divider,
} from 'antd';
import {
  ExperimentOutlined,
  SafetyCertificateOutlined,
  BlockOutlined,
  LineChartOutlined,
  RobotOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { RootState } from '../../store/store';
import { updateSystemStats } from '../../store/slices/dashboardSlice';

const { Title, Text, Paragraph } = Typography;

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'warning' | 'error' | 'maintenance';
  statusText: string;
  route: string;
  color: string;
  stats?: {
    label: string;
    value: string | number;
  };
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon,
  status,
  statusText,
  route,
  color,
  stats,
}) => {
  const navigate = useNavigate();

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#f5222d';
      case 'maintenance':
        return '#1890ff';
      default:
        return '#d9d9d9';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircleOutlined />;
      case 'warning':
        return <WarningOutlined />;
      case 'error':
        return <WarningOutlined />;
      case 'maintenance':
        return <ThunderboltOutlined />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  return (
    <Card
      hoverable
      style={{
        height: '100%',
        borderLeft: `4px solid ${color}`,
      }}
      actions={[
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(route)}
        >
          Open Tool
        </Button>,
      ]}
    >
      <Card.Meta
        avatar={
          <div style={{ fontSize: '24px', color }}>
            {icon}
          </div>
        }
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{title}</span>
            <Badge
              color={getStatusColor()}
              text={
                <Space size={4}>
                  {getStatusIcon()}
                  <Text style={{ fontSize: '12px' }}>{statusText}</Text>
                </Space>
              }
            />
          </div>
        }
        description={
          <div>
            <Paragraph style={{ marginBottom: '12px', color: '#666' }}>
              {description}
            </Paragraph>
            {stats && (
              <div style={{ marginTop: '8px' }}>
                <Text strong style={{ color }}>{stats.label}: </Text>
                <Text strong>{stats.value}</Text>
              </div>
            )}
          </div>
        }
      />
    </Card>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const systemStats = useSelector((state: RootState) => state.dashboard.systemStats);

  // Mock real-time updates using Redux
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(updateSystemStats({
        wasteProcessed: systemStats.wasteProcessed + Math.floor(Math.random() * 5),
        efficiency: Math.max(90, Math.min(100, systemStats.efficiency + (Math.random() - 0.5) * 0.5)),
        contaminationRate: Math.max(0, Math.min(10, systemStats.contaminationRate + (Math.random() - 0.5) * 0.2)),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch, systemStats]);

  const toolCategories: ToolCardProps[] = [
    {
      title: 'Multi-Modal Analysis',
      description: 'Advanced AI-powered waste classification using visual, spectral, weight, and chemical sensors achieving 98%+ accuracy through sensor fusion.',
      icon: <ExperimentOutlined />,
      status: 'active',
      statusText: 'System Active',
      route: '/waste-analysis',
      color: '#1890ff',
      stats: {
        label: 'Accuracy',
        value: '98.2%',
      },
    },
    {
      title: 'Contamination Detection',
      description: 'Real-time contamination detection in recyclable streams with automated flagging and AI-powered remediation suggestions.',
      icon: <SafetyCertificateOutlined />,
      status: 'warning',
      statusText: '3 Batches Flagged',
      route: '/contamination-detection',
      color: '#52c41a',
      stats: {
        label: 'Detection Rate',
        value: '99.1%',
      },
    },
    {
      title: 'Autonomous Processing',
      description: 'AI-controlled equipment with reinforcement learning agents optimizing processing parameters in real-time.',
      icon: <RobotOutlined />,
      status: 'active',
      statusText: '12/15 Units Active',
      route: '/dashboard',
      color: '#faad14',
      stats: {
        label: 'Efficiency Gain',
        value: '+23%',
      },
    },
    {
      title: 'Blockchain Certificates',
      description: 'NFT-based waste processing certificates with immutable proof of environmental impact and recycling achievements.',
      icon: <BlockOutlined />,
      status: 'active',
      statusText: 'Blockchain Connected',
      route: '/blockchain/certificates',
      color: '#722ed1',
      stats: {
        label: 'Certificates Minted',
        value: '2,847',
      },
    },
    {
      title: 'Analytics Dashboard',
      description: 'Comprehensive waste processing analytics with detailed reporting of environmental impact and cost optimization.',
      icon: <LineChartOutlined />,
      status: 'active',
      statusText: 'Real-time Data',
      route: '/analytics',
      color: '#13c2c2',
      stats: {
        label: 'Reports Generated',
        value: '1,234',
      },
    },
    {
      title: 'Metaverse Integration',
      description: 'Virtual waste management facilities with gamified experiences and educational content in immersive 3D environments.',
      icon: <GlobalOutlined />,
      status: 'active',
      statusText: 'Virtual Facility Online',
      route: '/dashboard',
      color: '#eb2f96',
      stats: {
        label: 'Active Users',
        value: systemStats.activeUsers.toLocaleString(),
      },
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #003a5c 100%)',
          padding: '60px 0',
          textAlign: 'center',
          color: 'white',
          marginBottom: '40px',
        }}
      >
        <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
          🌱 Advanced Waste Management System
        </Title>
        <Title level={3} style={{ color: '#91d5ff', fontWeight: 'normal', marginBottom: '24px' }}>
          AI-Powered • Blockchain-Enabled • Quantum-Enhanced
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#b7d7f0', maxWidth: '800px', margin: '0 auto 32px' }}>
          Transform waste management with cutting-edge AI, blockchain technology, and real-time analytics.
          Achieve 98%+ accuracy in waste classification, automated contamination detection, and immutable
          environmental impact tracking.
        </Paragraph>
        <Space size="large">
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/dashboard')}
          >
            Open Dashboard
          </Button>
          <Button
            size="large"
            style={{ color: 'white', borderColor: 'white' }}
            onClick={() => navigate('/waste-analysis')}
          >
            Start Analysis
          </Button>
        </Space>
      </div>

      {/* System Status Alert */}
      <Alert
        message="System Status: Fully Operational"
        description="All AI models active, blockchain connected, sensors calibrated. Real-time processing at optimal performance."
        type="success"
        showIcon
        style={{ marginBottom: '32px' }}
      />

      {/* Real-time Statistics */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#52c41a' }} />
            <span>Real-Time System Metrics</span>
          </Space>
        }
        style={{ marginBottom: '32px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic
              title="System Efficiency"
              value={systemStats.efficiency}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<ThunderboltOutlined />}
            />
            <Progress
              percent={systemStats.efficiency}
              size="small"
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic
              title="Waste Processed Today"
              value={systemStats.wasteProcessed}
              suffix="kg"
              prefix={<ExperimentOutlined />}
            />
            <Progress percent={78} size="small" showInfo={false} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic
              title="Contamination Rate"
              value={systemStats.contaminationRate}
              suffix="%"
              valueStyle={{ color: systemStats.contaminationRate > 5 ? '#cf1322' : '#faad14' }}
              prefix={<SafetyCertificateOutlined />}
            />
            <Progress
              percent={systemStats.contaminationRate}
              size="small"
              status={systemStats.contaminationRate > 5 ? 'exception' : 'active'}
              showInfo={false}
            />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic
              title="CO₂ Credits Generated"
              value={systemStats.carbonCredits}
              suffix="tons"
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
            />
            <Progress percent={85} size="small" showInfo={false} strokeColor="#1890ff" />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic
              title="Active Users"
              value={systemStats.activeUsers}
              prefix={<GlobalOutlined />}
            />
            <Progress percent={67} size="small" showInfo={false} strokeColor="#eb2f96" />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic
              title="System Uptime"
              value={systemStats.systemUptime}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
            <Progress
              percent={systemStats.systemUptime}
              size="small"
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Col>
        </Row>
      </Card>

      {/* Tool Categories */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>
          🛠️ Available Tools & Services
        </Title>
        <Row gutter={[16, 16]}>
          {toolCategories.map((tool, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <ToolCard {...tool} />
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      {/* Quick Start Guide */}
      <Card
        title="🚀 Quick Start Guide"
        style={{ marginBottom: '32px' }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card size="small" title="1. Upload Waste Sample">
              <Text>
                Navigate to Waste Analysis and upload an image of your waste sample
                for AI-powered classification and contamination detection.
              </Text>
              <div style={{ marginTop: '12px' }}>
                <Button
                  type="link"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/waste-analysis')}
                >
                  Start Analysis
                </Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title="2. Monitor Dashboard">
              <Text>
                View real-time system metrics, processing status, and alerts
                from the comprehensive dashboard interface.
              </Text>
              <div style={{ marginTop: '12px' }}>
                <Button
                  type="link"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/dashboard')}
                >
                  Open Dashboard
                </Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title="3. View Certificates">
              <Text>
                Access blockchain-based NFT certificates for processed waste
                and track environmental impact achievements.
              </Text>
              <div style={{ marginTop: '12px' }}>
                <Button
                  type="link"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/blockchain/certificates')}
                >
                  View Certificates
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default LandingPage;