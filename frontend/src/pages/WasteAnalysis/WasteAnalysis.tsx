import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Alert,
  Space,
  Typography,
  Card as AntCard,
  Tabs
} from 'antd';
import { Button, ErrorBoundary } from '../../components/Shared';
import '../shared-styles.css';
import styles from './WasteAnalysis.module.css';

const { Title, Text, Paragraph } = Typography;
import {
  UploadOutlined,
  ScanOutlined,
  ExperimentOutlined,
  CameraOutlined,
  BarChartOutlined,
  SyncOutlined,
  TrophyOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import SensorCalibration from './SensorCalibration';
import AnalysisHistory from './AnalysisHistory';

const WasteAnalysis: React.FC = () => {

  const tabItems = [
    {
      label: (
        <span>
          <UploadOutlined />
          Quick Analysis
        </span>
      ),
      key: '1',
      children: (
        <div className={styles.tabContent}>
          <Title level={4} className={styles.tabTitle}>
            Upload Your Waste Sample
          </Title>
          <Row justify="center">
            <Col xs={24} md={16} lg={12}>
              <AntCard className={styles.uploadCard}>
                <UploadOutlined className={styles.uploadIcon} />
                <Title level={5}>Drag & Drop or Click to Upload</Title>
                <Text type="secondary">
                  Supported formats: JPG, PNG, JPEG (Max: 10MB)
                </Text>
                <br />
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  size="large"
                  className={styles.uploadButton}
                >
                  Choose File
                </Button>
              </AntCard>
            </Col>
          </Row>
        </div>
      )
    },
    {
      label: (
        <span>
          <ScanOutlined />
          Live Camera
        </span>
      ),
      key: '2',
      children: (
        <div className={styles.tabContent}>
          <Title level={4} className={styles.tabTitle}>
            Real-Time Camera Analysis
          </Title>
          <Row justify="center">
            <Col xs={24} md={16} lg={12}>
              <AntCard className={styles.cameraCard}>
                <ScanOutlined className={styles.cameraIcon} />
                <Title level={5}>Camera Access Required</Title>
                <Text type="secondary" className={styles.cameraDescription}>
                  Allow camera access for real-time waste analysis
                </Text>
                <Button
                  type="primary"
                  icon={<ScanOutlined />}
                  size="large"
                  className={styles.cameraButton}
                >
                  Enable Camera
                </Button>
              </AntCard>
            </Col>
          </Row>
        </div>
      )
    },
    {
      label: (
        <span>
          <ExperimentOutlined />
          Sensor Calibration
        </span>
      ),
      key: '3',
      children: (
        <div className={styles.tabContent}>
          <SensorCalibration />
        </div>
      )
    },
    {
      label: (
        <span>
          <BarChartOutlined />
          Analysis History
        </span>
      ),
      key: '4',
      children: (
        <div className={styles.tabContent}>
          <AnalysisHistory />
        </div>
      )
    }
  ];
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
      <div className={styles.mainContainer}>
        {/* Animated Background Elements */}
        <div className={styles.bgBubble1} />
        <div className={styles.bgBubble2} />

        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroCard}>
            {/* Live Time Display */}
            <div className={styles.timeDisplay}>
              {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
            </div>

            <Title level={1} className={styles.heroTitle}>
              🔬 AI Waste Analysis
            </Title>

            <Title level={3} className={styles.heroSubtitle}>
              Multi-Modal • Real-Time • 98% Accuracy
            </Title>

            <Paragraph className={styles.heroDescription}>
              Advanced AI-powered waste classification using visual, spectral, weight, and chemical sensors.
              Upload samples for instant analysis and real-time processing optimization.
            </Paragraph>

            <Space size="large">
              <div className={styles.primaryButtonWrapper}>
                <Button
                  type="primary"
                  size="large"
                  icon={<CameraOutlined />}
                  className={styles.primaryButton}
                >
                  Upload Sample
                </Button>
              </div>
              <Button
                size="large"
                icon={<BarChartOutlined />}
                className={styles.secondaryButton}
              >
                View Analytics
              </Button>
            </Space>

            {/* Key Stats */}
            <Row gutter={[32, 24]} justify="center" className={styles.statsRow}>
              <Col xs={12} sm={6}>
                <div className={styles.statItem}>
                  <div className={styles.statValueGreen}>98.2%</div>
                  <div className={styles.statLabel}>Accuracy Rate</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className={styles.statItem}>
                  <div className={styles.statValueBlue}>1,247</div>
                  <div className={styles.statLabel}>Samples Today</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className={styles.statItem}>
                  <div className={styles.statValueOrange}>4</div>
                  <div className={styles.statLabel}>Modal Sensors</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className={styles.statItem}>
                  <div className={styles.statValuePink}><SyncOutlined spin /></div>
                  <div className={styles.statLabel}>Real-Time</div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* System Status Alert */}
        <div className={styles.sectionContainer}>
          <Alert
            message={<span className={styles.alertTitle}>🔬 Analysis System Active</span>}
            description="Multi-modal sensors calibrated, AI models loaded, real-time processing enabled."
            type="success"
            showIcon
            className={styles.alertCard}
          />
        </div>

        {/* Analysis Tools */}
        <div className={styles.sectionContainerLarge}>
          <div className={styles.sectionHeader}>
            <Title level={2} className={styles.sectionTitle}>
              🛠️ Analysis Tools
            </Title>
            <Paragraph className={styles.sectionSubtitle}>
              Choose your analysis method and upload samples for instant AI-powered classification
            </Paragraph>
          </div>

          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={6}>
              <AntCard className={styles.toolCard}>
                <UploadOutlined className={styles.toolIconBlue} />
                <Title level={4} className={styles.toolTitle}>Image Upload</Title>
                <Text className={styles.toolDescription}>
                  Upload waste images for visual analysis
                </Text>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  className={styles.toolButtonBlue}
                >
                  Upload Image
                </Button>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <AntCard className={styles.toolCard}>
                <ScanOutlined className={styles.toolIconGreen} />
                <Title level={4} className={styles.toolTitle}>Live Scan</Title>
                <Text className={styles.toolDescription}>
                  Real-time camera analysis
                </Text>
                <Button
                  type="primary"
                  icon={<ScanOutlined />}
                  className={styles.toolButtonGreen}
                >
                  Start Scan
                </Button>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <AntCard className={styles.toolCard}>
                <ExperimentOutlined className={styles.toolIconOrange} />
                <Title level={4} className={styles.toolTitle}>Multi-Modal</Title>
                <Text className={styles.toolDescription}>
                  Combined sensor analysis
                </Text>
                <Button
                  type="primary"
                  icon={<ExperimentOutlined />}
                  className={styles.toolButtonOrange}
                >
                  Full Analysis
                </Button>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <AntCard className={styles.toolCard}>
                <BarChartOutlined className={styles.toolIconPurple} />
                <Title level={4} className={styles.toolTitle}>Analytics</Title>
                <Text className={styles.toolDescription}>
                  View analysis history and trends
                </Text>
                <Button
                  type="primary"
                  icon={<BarChartOutlined />}
                  className={styles.toolButtonPurple}
                >
                  View Analytics
                </Button>
              </AntCard>
            </Col>
          </Row>
        </div>

        {/* Analysis Tabs */}
        <div className={styles.sectionContainerXl}>
          <AntCard className={styles.tabsCard}>
            <Tabs items={tabItems} defaultActiveKey="1" size="large" />
          </AntCard>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <Title level={4} className={styles.footerTitle}>
              🔬 Advanced AI Analysis
            </Title>
            <Paragraph className={styles.footerDescription}>
              Powered by multi-modal sensors and cutting-edge machine learning algorithms
            </Paragraph>
            <Space size="large">
              <Button
                type="text"
                className={styles.footerButton}
                icon={<TrophyOutlined />}
              >
                98% Accuracy
              </Button>
              <Button
                type="text"
                className={styles.footerButton}
                icon={<ThunderboltOutlined />}
              >
                Real-Time Processing
              </Button>
              <Button
                type="text"
                className={styles.footerButton}
                icon={<ExperimentOutlined />}
              >
                Multi-Modal Analysis
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default WasteAnalysis;