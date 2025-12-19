import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Row, Col, Tag } from 'antd';
import {
  LineChartOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  DownloadOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  BulbOutlined
} from '@ant-design/icons';
import styles from './Analytics.module.css';

const { Title, Paragraph } = Typography;

const Analytics: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
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
            📊 Analytics Dashboard
          </Title>

          <Title level={3} className={styles.heroSubtitle}>
            Real-Time • Comprehensive • Actionable Insights
          </Title>

          <Paragraph className={styles.heroDescription}>
            Advanced analytics and reporting platform providing comprehensive insights into waste management operations,
            environmental impact, and system performance with real-time data visualization.
          </Paragraph>

          <Space size="large">
            <div className={styles.buttonWrapper}>
              <Button
                type="primary"
                size="large"
                icon={<BarChartOutlined />}
                className={styles.primaryButton}
              >
                View Dashboard
              </Button>
            </div>
            <Button
              size="large"
              icon={<DownloadOutlined />}
              className={styles.secondaryButton}
            >
              Export Report
            </Button>
          </Space>

          {/* Key Stats */}
          <Row gutter={[32, 24]} justify="center" className={styles.statsRow}>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueGreen}>94.7%</div>
                <div className={styles.statLabel}>System Efficiency</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueBlue}>12.4K</div>
                <div className={styles.statLabel}>Data Points Today</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueOrange}>28</div>
                <div className={styles.statLabel}>Active Reports</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValuePink}>
                  <SyncOutlined spin />
                </div>
                <div className={styles.statLabel}>Live Updates</div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* System Status Alert */}
      <div className={styles.alertSection}>
        <div className={styles.alertBox}>
          <CheckCircleOutlined className={styles.alertIcon} />
          <div>
            <div className={styles.alertTitle}>
              📈 Analytics Engine Active
            </div>
            <div className={styles.alertDescription}>
              Real-time data processing, automated reporting, predictive analytics enabled.
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Features */}
      <div className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <Title level={2} className={styles.sectionTitle}>
            📈 Analytics Capabilities
          </Title>
          <Paragraph className={styles.sectionDescription}>
            Comprehensive data visualization and reporting tools for waste management insights
          </Paragraph>
        </div>

        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.featureCard}>
              <LineChartOutlined className={styles.featureIconBlue} />
              <Title level={4} className={styles.featureTitle}>Trend Analysis</Title>
              <Paragraph className={styles.featureDescription}>
                Historical data analysis and trend identification for performance optimization
              </Paragraph>
              <Tag color="blue" className={styles.tagSmall}>Time Series</Tag>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.featureCard}>
              <PieChartOutlined className={styles.featureIconGreen} />
              <Title level={4} className={styles.featureTitle}>Composition Analysis</Title>
              <Paragraph className={styles.featureDescription}>
                Waste composition breakdown and material flow analysis
              </Paragraph>
              <Tag color="green" className={styles.tagSmall}>Material Flow</Tag>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.featureCard}>
              <AreaChartOutlined className={styles.featureIconOrange} />
              <Title level={4} className={styles.featureTitle}>Performance Metrics</Title>
              <Paragraph className={styles.featureDescription}>
                Key performance indicators and efficiency measurements
              </Paragraph>
              <Tag color="orange" className={styles.tagSmall}>KPIs</Tag>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.featureCard}>
              <BarChartOutlined className={styles.featureIconPurple} />
              <Title level={4} className={styles.featureTitle}>Predictive Insights</Title>
              <Paragraph className={styles.featureDescription}>
                AI-powered forecasting and predictive maintenance alerts
              </Paragraph>
              <Tag color="purple" className={styles.tagSmall}>AI Powered</Tag>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Analytics Interface */}
      <div className={styles.mainSection}>
        <Card className={styles.mainCard}>
          <div className={styles.mainContent}>
            <LineChartOutlined className={styles.mainIcon} />
            <Title level={3} className={styles.mainTitle}>
              Advanced Analytics Platform
            </Title>
            <Paragraph className={styles.mainDescription}>
              Comprehensive analytics dashboard with real-time data visualization, automated reporting,
              and predictive insights for waste management operations and environmental impact assessment.
            </Paragraph>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<BarChartOutlined />}
                className={styles.actionButton}
              >
                Open Dashboard
              </Button>
              <Button
                size="large"
                icon={<DownloadOutlined />}
                className={styles.outlineButton}
              >
                Generate Report
              </Button>
            </Space>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <Title level={4} className={styles.footerTitle}>
            📊 Data-Driven Sustainability
          </Title>
          <Paragraph className={styles.footerDescription}>
            Leveraging advanced analytics for optimized waste management and environmental impact
          </Paragraph>
          <Space size="large">
            <Button type="text" className={styles.footerButton} icon={<RiseOutlined />}>
              Real-Time
            </Button>
            <Button type="text" className={styles.footerButton} icon={<ThunderboltOutlined />}>
              Predictive
            </Button>
            <Button type="text" className={styles.footerButton} icon={<BulbOutlined />}>
              Actionable
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default Analytics;