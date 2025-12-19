import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Alert, 
  Space, 
  Typography, 
  Row, 
  Col,
  Card as AntCard
} from 'antd';
import { Button, ErrorBoundary } from '../../components/Shared';
import '../shared-styles.css';
import styles from './ContaminationDetection.module.css';
import { 
  UploadOutlined, 
  ScanOutlined, 
  WarningOutlined, 
  ThunderboltOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  CameraOutlined,
  BarChartOutlined,
  SyncOutlined
} from '@ant-design/icons';
import FlaggedBatchesList from './FlaggedBatchesList';
import ContaminationStats from './ContaminationStats';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const ContaminationDetection: React.FC = () => {
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
              🛡️ Contamination Detection
            </Title>

            <Title level={3} className={styles.heroSubtitle}>
              AI-Powered • Real-Time • 99% Accuracy
            </Title>

            <Paragraph className={styles.heroDescription}>
              Advanced contamination detection system using multi-spectral imaging and AI algorithms.
              Identify and quantify contamination in recyclable streams with precision.
            </Paragraph>

            <Space size="large">
              <div className={styles.buttonWrapper}>
                <Button
                  type="primary"
                  size="large"
                  icon={<CameraOutlined />}
                  className={styles.primaryButton}
                >
                  Start Detection
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
                  <div className={styles.statValueGreen}>99.2%</div>
                  <div className={styles.statLabel}>Detection Rate</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className={styles.statItem}>
                  <div className={styles.statValueBlue}>2,847</div>
                  <div className={styles.statLabel}>Batches Scanned</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className={styles.statItem}>
                  <div className={styles.statValueOrange}>156</div>
                  <div className={styles.statLabel}>Flagged Today</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className={styles.statItem}>
                  <div className={styles.statValuePink}>
                    <SyncOutlined spin />
                  </div>
                  <div className={styles.statLabel}>Real-Time</div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* System Status Alert */}
        <div className={styles.alertSection}>
          <Alert
            message={
              <span className={styles.alertMessageText}>
                🛡️ Detection System Active
              </span>
            }
            description="Multi-spectral sensors calibrated, AI models loaded, contamination detection enabled."
            type="success"
            showIcon
            className={styles.systemAlert}
          />
        </div>
        {/* Detection Tools */}
        <div className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <Title level={2} className={styles.toolsSectionTitle}>
              🛠️ Detection Tools
            </Title>
            <Paragraph className={styles.toolsSectionDescription}>
              Choose your detection method and upload samples for instant contamination analysis
            </Paragraph>
          </div>

          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={6}>
              <AntCard className={styles.featureCard}>
                <UploadOutlined className={styles.featureIconBlue} />
                <Title level={4} className={styles.cardTitle}>Image Upload</Title>
                <Text className={styles.cardText}>
                  Upload waste images for contamination analysis
                </Text>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  className={styles.blueButton}
                >
                  Upload Image
                </Button>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <AntCard className={styles.featureCard}>
                <ScanOutlined className={styles.featureIconGreen} />
                <Title level={4} className={styles.cardTitle}>Live Scan</Title>
                <Text className={styles.cardText}>
                  Real-time camera contamination detection
                </Text>
                <Button
                  type="primary"
                  icon={<ScanOutlined />}
                  className={styles.greenButton}
                >
                  Start Scan
                </Button>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <AntCard className={styles.featureCard}>
                <WarningOutlined className={styles.featureIconOrange} />
                <Title level={4} className={styles.cardTitle}>Batch Analysis</Title>
                <Text className={styles.cardText}>
                  Analyze entire batches for contamination
                </Text>
                <Button
                  type="primary"
                  icon={<ExperimentOutlined />}
                  className={styles.orangeButton}
                >
                  Analyze Batch
                </Button>
              </AntCard>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <AntCard className={styles.featureCard}>
                <BarChartOutlined className={styles.featureIconPurple} />
                <Title level={4} className={styles.cardTitle}>Analytics</Title>
                <Text className={styles.cardText}>
                  View contamination trends and reports
                </Text>
                <Button
                  type="primary"
                  icon={<BarChartOutlined />}
                  className={styles.purpleButton}
                >
                  View Analytics
                </Button>
              </AntCard>
            </Col>
          </Row>
        </div>

        {/* Analysis Tabs */}
        <div className={styles.tabsSection}>
          <AntCard className={styles.tabsCard}>
            <Tabs defaultActiveKey="1" size="large">
              <TabPane
                tab={
                  <span>
                    <ScanOutlined />
                    Detection
                  </span>
                }
                key="1"
              >
                <div className={styles.tabContent}>
                  <Title level={4} className={styles.tabTitle}>
                    Upload Waste Sample for Contamination Analysis
                  </Title>
                  <Row justify="center">
                    <Col xs={24} md={16} lg={12}>
                      <AntCard className={styles.uploadCard}>
                        <UploadOutlined className={styles.uploadCardIcon} />
                        <Title level={5}>Drag & Drop or Click to Upload</Title>
                        <Text type="secondary">
                          Supported formats: JPG, PNG, JPEG (Max: 10MB)
                        </Text>
                        <br />
                        <Button
                          type="primary"
                          icon={<UploadOutlined />}
                          size="large"
                          className={styles.navyButton}
                        >
                          Choose File
                        </Button>
                      </AntCard>
                    </Col>
                  </Row>
                </div>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <WarningOutlined />
                    Flagged Batches (0)
                  </span>
                }
                key="2"
              >
                <div className={styles.tabContent}>
                  <FlaggedBatchesList />
                </div>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <BarChartOutlined />
                    Statistics
                  </span>
                }
                key="3"
              >
                <div className={styles.tabContent}>
                  <ContaminationStats />
                </div>
              </TabPane>
            </Tabs>
          </AntCard>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <Title level={4} className={styles.footerTitle}>
              🛡️ Advanced Contamination Detection
            </Title>
            <Paragraph className={styles.footerDescription}>
              Powered by multi-spectral imaging and cutting-edge AI algorithms
            </Paragraph>
            <Space size="large">
              <Button
                type="text"
                className={styles.footerButton}
                icon={<TrophyOutlined />}
              >
                99% Accuracy
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
                Multi-Spectral Analysis
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ContaminationDetection;