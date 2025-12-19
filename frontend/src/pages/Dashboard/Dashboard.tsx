import React, { useEffect, useState } from 'react';
import { Row, Col, Statistic, Typography, Progress, Alert, Card as AntCard, Space, Button } from 'antd';
import Card from '../../components/Shared/Card';
import ErrorBoundary from '../../components/Shared/ErrorBoundary';
import { RESPONSIVE_CONFIGS } from '../../utils/responsive';
import '../shared-styles.css';
import styles from './Dashboard.module.css';

const { Title, Text, Paragraph } = Typography;
import {
  ExperimentOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  GlobalOutlined,
  TrophyOutlined,
  HeartOutlined,
  EnvironmentOutlined,
  BulbOutlined,
  TeamOutlined,
  RiseOutlined,
  ArrowRightOutlined,
  RocketOutlined
} from '@ant-design/icons';

const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ErrorBoundary>
      <div className={styles.dashboard}>
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
              🚀 System Dashboard
            </Title>

            <Title level={3} className={styles.heroSubtitle}>
              AI-Powered • Real-Time • Analytics-Driven
            </Title>

            <Paragraph className={styles.heroDescription}>
              Welcome to your advanced waste management command center.
              Monitor real-time operations, track performance metrics, and optimize your waste processing ecosystem.
            </Paragraph>

            <Space size="large">
              <div className={styles.quickActionsWrapper}>
                <Button
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  className={styles.quickActionsButton}
                >
                  Quick Actions
                </Button>
              </div>
              <Button
                size="large"
                icon={<BulbOutlined />}
                className={styles.viewReportsButton}
              >
                View Reports
              </Button>
            </Space>
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
            description="All AI models active, sensors calibrated, blockchain connected. Processing at optimal efficiency."
            type="success"
            showIcon
            className={styles.systemAlert}
          />
        </div>

        {/* Key Metrics */}
        <div className={styles.metricsSection}>
          <div className={styles.metricsSectionHeader}>
            <Title level={2} className={styles.metricsSectionTitle}>
              📊 Key Performance Metrics
            </Title>
            <Paragraph className={styles.metricsSectionDescription}>
              Real-time monitoring of your waste management operations
            </Paragraph>
          </div>

          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <AntCard className={styles.metricCard}>
                <Statistic
                  title={<span className={styles.metricLabel}>System Efficiency</span>}
                  value={94.2}
                  suffix="%"
                  valueStyle={{ color: '#10b981', fontSize: '28px', fontWeight: '800' }}
                  prefix={<ThunderboltOutlined className={styles.iconGreen} />}
                />
                <Progress
                  percent={94.2}
                  size="small"
                  showInfo={false}
                  strokeColor="#10b981"
                  className={styles.progressMarginTop}
                />
              </AntCard>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <AntCard className={styles.metricCard}>
                <Statistic
                  title={<span className={styles.metricLabel}>Waste Processed Today</span>}
                  value={1247}
                  suffix="kg"
                  valueStyle={{ color: '#3b82f6', fontSize: '28px', fontWeight: '800' }}
                  prefix={<ExperimentOutlined className={styles.iconBlue} />}
                />
                <Progress percent={78} size="small" showInfo={false} className={styles.progressMarginTop} />
              </AntCard>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <AntCard className={styles.metricCard}>
                <Statistic
                  title={<span className={styles.metricLabel}>Contamination Rate</span>}
                  value={2.3}
                  suffix="%"
                  valueStyle={{ color: '#ef4444', fontSize: '28px', fontWeight: '800' }}
                  prefix={<SafetyCertificateOutlined className={styles.iconRed} />}
                />
                <Progress
                  percent={2.3}
                  size="small"
                  status="exception"
                  showInfo={false}
                  className={styles.progressMarginTop}
                />
              </AntCard>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <AntCard className={styles.metricCard}>
                <Statistic
                  title={<span className={styles.metricLabel}>Carbon Credits</span>}
                  value={156.7}
                  suffix="tons CO₂"
                  valueStyle={{ color: '#8b5cf6', fontSize: '28px', fontWeight: '800' }}
                  prefix={<DollarOutlined className={styles.iconPurple} />}
                />
                <Progress percent={85} size="small" showInfo={false} strokeColor="#8b5cf6" className={styles.progressMarginTop} />
              </AntCard>
            </Col>
          </Row>
        </div>

        {/* Feature Cards */}
        <div className={styles.featuresSection}>
          <div className={styles.featuresSectionHeader}>
            <Title level={2} className={styles.featuresSectionTitle}>
              🛠️ System Features
            </Title>
            <Paragraph className={styles.featuresSectionDescription}>
              Explore the powerful capabilities of your waste management platform
            </Paragraph>
          </div>

          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={8}>
              <AntCard
                title={
                  <Space>
                    <ExperimentOutlined className={styles.iconBlue} />
                    <span className={styles.featureCardTitle}>Multi-Modal Analysis</span>
                  </Space>
                }
                className={styles.featureCard}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    className={styles.featureButtonBlue}
                  >
                    Analyze
                  </Button>
                }
              >
                <Text className={styles.featureCardText}>
                  Advanced AI-powered waste classification using visual, spectral, weight, and chemical sensors
                  achieving 98%+ accuracy through sensor fusion technology.
                </Text>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <AntCard
                title={
                  <Space>
                    <SafetyCertificateOutlined className={styles.iconGreen} />
                    <span className={styles.featureCardTitle}>Contamination Detection</span>
                  </Space>
                }
                className={styles.featureCard}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    className={styles.featureButtonGreen}
                  >
                    Detect
                  </Button>
                }
              >
                <Text className={styles.featureCardText}>
                  Real-time contamination detection in recyclable streams with automated flagging
                  and AI-powered remediation suggestions for optimal processing.
                </Text>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <AntCard
                title={
                  <Space>
                    <RobotOutlined className={styles.iconOrange} />
                    <span className={styles.featureCardTitle}>Autonomous Processing</span>
                  </Space>
                }
                className={styles.featureCard}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    className={styles.featureButtonOrange}
                  >
                    Monitor
                  </Button>
                }
              >
                <Text className={styles.featureCardText}>
                  AI-controlled equipment with reinforcement learning agents optimizing processing
                  parameters in real-time for maximum efficiency and cost savings.
                </Text>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <AntCard
                title={
                  <Space>
                    <GlobalOutlined className={styles.iconPurple} />
                    <span className={styles.featureCardTitle}>Blockchain Integration</span>
                  </Space>
                }
                className={styles.featureCard}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    className={styles.featureButtonPurple}
                  >
                    View
                  </Button>
                }
              >
                <Text className={styles.featureCardText}>
                  NFT-based waste processing certificates with immutable proof of environmental impact
                  and recycling achievements on the blockchain.
                </Text>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <AntCard
                title={
                  <Space>
                    <RiseOutlined className={styles.iconCyan} />
                    <span className={styles.featureCardTitle}>Analytics Dashboard</span>
                  </Space>
                }
                className={styles.featureCard}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    className={styles.featureButtonCyan}
                  >
                    Analyze
                  </Button>
                }
              >
                <Text className={styles.featureCardText}>
                  Comprehensive waste processing analytics with detailed reporting of environmental impact,
                  cost optimization, and system performance metrics.
                </Text>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <AntCard
                title={
                  <Space>
                    <TrophyOutlined className={styles.iconPink} />
                    <span className={styles.featureCardTitle}>Sustainability Goals</span>
                  </Space>
                }
                className={styles.featureCard}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    className={styles.featureButtonPink}
                  >
                    Track
                  </Button>
                }
              >
                <Text className={styles.featureCardText}>
                  Track progress towards sustainability goals with carbon credit generation,
                  recycling efficiency metrics, and environmental impact assessments.
                </Text>
              </AntCard>
            </Col>
          </Row>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <Title level={4} className={styles.footerTitle}>
              📈 Real-Time Dashboard
            </Title>
            <Paragraph className={styles.footerDescription}>
              Your command center for intelligent waste management operations
            </Paragraph>
            <Space size="large">
              <Button type="text" className={styles.footerButton} icon={<HeartOutlined />}>
                Optimized Performance
              </Button>
              <Button type="text" className={styles.footerButton} icon={<EnvironmentOutlined />}>
                Environmental Impact
              </Button>
              <Button type="text" className={styles.footerButton} icon={<TeamOutlined />}>
                Team Collaboration
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;