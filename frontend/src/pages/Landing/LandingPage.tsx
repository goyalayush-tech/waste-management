import React, { useEffect, useState } from 'react';
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
  RocketOutlined,
  HeartOutlined,
  EnvironmentOutlined,
  BulbOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { RootState } from '../../store/store';
import { updateSystemStats } from '../../store/slices/dashboardSlice';
import styles from './LandingPage.module.css';

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
      className={styles.toolCard}
      style={{ borderLeft: `4px solid ${color}` }}
      actions={[
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(route)}
          className={styles.toolCardButton}
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            boxShadow: `0 4px 12px ${color}40`,
          }}
        >
          Open Tool
        </Button>,
      ]}
    >
      <Card.Meta
        avatar={
          <div 
            className={styles.toolCardAvatar}
            style={{ color, background: `${color}15` }}
          >
            {icon}
          </div>
        }
        title={
          <div className={styles.toolCardTitleContainer}>
            <span className={styles.toolCardTitle}>{title}</span>
            <Badge
              color={getStatusColor()}
              text={
                <Space size={4}>
                  {getStatusIcon()}
                  <Text className={styles.toolCardStatusText}>{statusText}</Text>
                </Space>
              }
            />
          </div>
        }
        description={
          <div>
            <Paragraph className={styles.toolCardDescription}>
              {description}
            </Paragraph>
            {stats && (
              <div 
                className={styles.toolCardStats}
                style={{ background: `${color}08`, border: `1px solid ${color}20` }}
              >
                <Text strong className={styles.toolCardStatsLabel} style={{ color }}>{stats.label}: </Text>
                <Text strong className={styles.toolCardStatsValue}>{stats.value}</Text>
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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    <div className={styles.landingPage}>
      {/* Animated Background Elements */}
      <div className={styles.floatingCircle1} />
      <div className={styles.floatingCircle2} />
      <div className={styles.floatingCircle3} />

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroCard}>
          {/* Live Time Display */}
          <div className={styles.liveTime}>
            {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
          </div>

          <Title level={1} className={styles.heroTitle}>
            🌱 Smart Waste Revolution
          </Title>

          <Title level={3} className={styles.heroSubtitle}>
            AI-Powered • Blockchain-Enabled • Future-Ready
          </Title>

          <Paragraph className={styles.heroDescription}>
            Transform Delhi's waste management with cutting-edge AI, blockchain technology,
            and real-time analytics. Achieve 98%+ accuracy in waste classification,
            automated contamination detection, and immutable environmental impact tracking.
          </Paragraph>

          <Space size="large" className={styles.heroButtons}>
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={() => navigate('/app/dashboard')}
              className={styles.launchButton}
            >
              Launch Dashboard
            </Button>
            <Button
              size="large"
              icon={<BulbOutlined />}
              onClick={() => navigate('/app/waste-analysis')}
              className={styles.analysisButton}
            >
              Start Analysis
            </Button>
          </Space>

          {/* Key Stats */}
          <Row gutter={[32, 24]} justify="center">
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueGreen}>98.2%</div>
                <div className={styles.statLabel}>AI Accuracy</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueBlue}>2,847</div>
                <div className={styles.statLabel}>Certificates</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueOrange}>+23%</div>
                <div className={styles.statLabel}>Efficiency</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValuePink}>24/7</div>
                <div className={styles.statLabel}>Monitoring</div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* System Status Alert */}
      <div className={styles.alertSection}>
        <Alert
          message={
            <span className={styles.alertMessage}>
              ✨ System Status: Fully Operational
            </span>
          }
          description="All AI models active, blockchain connected, sensors calibrated. Real-time processing at optimal performance."
          type="success"
          showIcon
          className={styles.systemAlert}
        />
      </div>

      {/* Real-time Statistics */}
      <div className={styles.metricsSection}>
        <Card
          title={
            <Space>
              <ThunderboltOutlined className={styles.iconSuccess} />
              <span className={styles.metricsCardTitle}>Real-Time System Metrics</span>
            </Space>
          }
          className={styles.metricsCard}
        >
          <Row gutter={[24, 24]}>
            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={styles.metricItem}>
                <Statistic
                  title={<span className={styles.metricLabel}>System Efficiency</span>}
                  value={systemStats.efficiency}
                  suffix="%"
                  valueStyle={{ color: '#3f8600', fontSize: '24px', fontWeight: '800' }}
                  prefix={<ThunderboltOutlined className={styles.iconGreen} />}
                />
                <Progress
                  percent={systemStats.efficiency}
                  size="small"
                  showInfo={false}
                  strokeColor="#52c41a"
                  className={styles.progressMarginTop}
                />
              </div>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={styles.metricItem}>
                <Statistic
                  title={<span className={styles.metricLabel}>Waste Processed Today</span>}
                  value={systemStats.wasteProcessed}
                  suffix="kg"
                  valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '800' }}
                  prefix={<ExperimentOutlined className={styles.iconBlue} />}
                />
                <Progress percent={78} size="small" showInfo={false} className={styles.progressMarginTop} />
              </div>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={styles.metricItem}>
                <Statistic
                  title={<span className={styles.metricLabel}>Contamination Rate</span>}
                  value={systemStats.contaminationRate}
                  suffix="%"
                  valueStyle={{
                    color: systemStats.contaminationRate > 5 ? '#cf1322' : '#faad14',
                    fontSize: '24px',
                    fontWeight: '800'
                  }}
                  prefix={<SafetyCertificateOutlined style={{ color: systemStats.contaminationRate > 5 ? '#cf1322' : '#faad14' }} />}
                />
                <Progress
                  percent={systemStats.contaminationRate}
                  size="small"
                  status={systemStats.contaminationRate > 5 ? 'exception' : 'active'}
                  showInfo={false}
                  className={styles.progressMarginTop}
                />
              </div>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={styles.metricItem}>
                <Statistic
                  title={<span className={styles.metricLabel}>CO₂ Credits Generated</span>}
                  value={systemStats.carbonCredits}
                  suffix="tons"
                  valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '800' }}
                  prefix={<DollarOutlined className={styles.iconBlue} />}
                />
                <Progress percent={85} size="small" showInfo={false} strokeColor="#1890ff" className={styles.progressMarginTop} />
              </div>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={styles.metricItem}>
                <Statistic
                  title={<span className={styles.metricLabel}>Active Users</span>}
                  value={systemStats.activeUsers}
                  valueStyle={{ color: '#eb2f96', fontSize: '24px', fontWeight: '800' }}
                  prefix={<GlobalOutlined className={styles.iconPink} />}
                />
                <Progress percent={67} size="small" showInfo={false} strokeColor="#eb2f96" className={styles.progressMarginTop} />
              </div>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={styles.metricItem}>
                <Statistic
                  title={<span className={styles.metricLabel}>System Uptime</span>}
                  value={systemStats.systemUptime}
                  suffix="%"
                  valueStyle={{ color: '#3f8600', fontSize: '24px', fontWeight: '800' }}
                  prefix={<CheckCircleOutlined className={styles.iconDarkGreen} />}
                />
                <Progress
                  percent={systemStats.systemUptime}
                  size="small"
                  showInfo={false}
                  strokeColor="#52c41a"
                  className={styles.progressMarginTop}
                />
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Tool Categories */}
      <div className={styles.toolsSection}>
        <div className={styles.toolsSectionHeader}>
          <Title level={2} className={styles.toolsSectionTitle}>
            🛠️ Available Tools & Services
          </Title>
          <Paragraph className={styles.toolsSectionDescription}>
            Explore our comprehensive suite of AI-powered tools designed for modern waste management
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {toolCategories.map((tool, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <ToolCard {...tool} />
            </Col>
          ))}
        </Row>
      </div>

      <Divider className={styles.dividerWhite} />

      {/* Quick Start Guide */}
      <div className={styles.quickStartSection}>
        <Card
          title={
            <span className={styles.quickStartTitle}>
              🚀 Quick Start Guide
            </span>
          }
          className={styles.quickStartCard}
        >
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Card
                size="small"
                title={<span className={styles.stepCardTitle}>1. 📸 Upload Waste Sample</span>}
                className={styles.stepCardBlue}
              >
                <Text className={styles.stepCardText}>
                  Navigate to Waste Analysis and upload an image of your waste sample
                  for AI-powered classification and contamination detection.
                </Text>
                <div className={styles.stepCardButtonWrapper}>
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate('/app/waste-analysis')}
                    className={styles.stepButtonBlue}
                  >
                    Start Analysis
                  </Button>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                title={<span className={styles.stepCardTitle}>2. 📊 Monitor Dashboard</span>}
                className={styles.stepCardGreen}
              >
                <Text className={styles.stepCardText}>
                  View real-time system metrics, processing status, and alerts
                  from the comprehensive dashboard interface.
                </Text>
                <div className={styles.stepCardButtonWrapper}>
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate('/app/dashboard')}
                    className={styles.stepButtonGreen}
                  >
                    Open Dashboard
                  </Button>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                title={<span className={styles.stepCardTitle}>3. 🏆 View Certificates</span>}
                className={styles.stepCardPurple}
              >
                <Text className={styles.stepCardText}>
                  Access blockchain-based NFT certificates for processed waste
                  and track environmental impact achievements.
                </Text>
                <div className={styles.stepCardButtonWrapper}>
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate('/app/blockchain/certificates')}
                    className={styles.stepButtonPurple}
                  >
                    View Certificates
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <Title level={4} className={styles.footerTitle}>
            🌱 Delhi Waste Management System
          </Title>
          <Paragraph className={styles.footerDescription}>
            Revolutionizing waste management with AI, blockchain, and real-time analytics
          </Paragraph>
          <Space size="large">
            <Button type="text" className={styles.footerButton} icon={<HeartOutlined />}>
              Made with love for Delhi
            </Button>
            <Button type="text" className={styles.footerButton} icon={<EnvironmentOutlined />}>
              Sustainable Future
            </Button>
            <Button type="text" className={styles.footerButton} icon={<TeamOutlined />}>
              Community Driven
            </Button>
          </Space>
          <div className={styles.footerCopyright}>
            © 2025 Delhi Waste Management. Building a cleaner, greener future.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;