import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Row, Col, Tag } from 'antd';
import { 
  BlockOutlined, 
  SyncOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  LockOutlined,
  DollarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import styles from './BlockchainCertificates.module.css';

const { Title, Paragraph } = Typography;

const BlockchainCertificates: React.FC = () => {
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
            ⛓️ Blockchain Certificates
          </Title>

          <Title level={3} className={styles.heroSubtitle}>
            NFT-Based • Immutable • Transparent
          </Title>

          <Paragraph className={styles.heroDescription}>
            Revolutionary NFT-based waste processing certificates providing immutable proof of environmental impact.
            Track, trade, and verify sustainable waste management achievements on the blockchain.
          </Paragraph>

          <Space size="large">
            <div className={styles.buttonWrapper}>
              <Button
                type="primary"
                size="large"
                icon={<BlockOutlined />}
                className={styles.primaryButton}
              >
                Mint Certificate
              </Button>
            </div>
            <Button
              size="large"
              icon={<GlobalOutlined />}
              className={styles.secondaryButton}
            >
              View Marketplace
            </Button>
          </Space>

          {/* Key Stats */}
          <Row gutter={[32, 24]} justify="center" className={styles.statsRow}>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueGreen}>1,247</div>
                <div className={styles.statLabel}>Certificates Minted</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueBlue}>$2.4M</div>
                <div className={styles.statLabel}>Trading Volume</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueOrange}>892</div>
                <div className={styles.statLabel}>Active Holders</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValuePink}>
                  <SyncOutlined spin />
                </div>
                <div className={styles.statLabel}>Live Network</div>
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
              🔗 Blockchain Network Active
            </div>
            <div className={styles.alertDescription}>
              Polygon network connected, smart contracts deployed, NFT minting enabled.
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Features */}
      <div className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <Title level={2} className={styles.sectionTitle}>
            🏆 Certificate Features
          </Title>
          <Paragraph className={styles.sectionDescription}>
            Discover the power of blockchain-backed environmental certificates
          </Paragraph>
        </div>

        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.featureCard}>
              <LockOutlined className={styles.featureIconPurple} />
              <Title level={4} className={styles.featureTitle}>Immutable Proof</Title>
              <Paragraph className={styles.featureDescription}>
                Cryptographically secure certificates that cannot be altered or forged
              </Paragraph>
              <Tag color="purple" className={styles.tagSmall}>Blockchain Secured</Tag>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.featureCard}>
              <GlobalOutlined className={styles.featureIconGreen} />
              <Title level={4} className={styles.featureTitle}>Global Trading</Title>
              <Paragraph className={styles.featureDescription}>
                Trade environmental impact certificates on global marketplaces
              </Paragraph>
              <Tag color="green" className={styles.tagSmall}>Market Ready</Tag>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.featureCard}>
              <DollarOutlined className={styles.featureIconOrange} />
              <Title level={4} className={styles.featureTitle}>Carbon Credits</Title>
              <Paragraph className={styles.featureDescription}>
                Convert waste processing achievements into tradable carbon credits
              </Paragraph>
              <Tag color="orange" className={styles.tagSmall}>Carbon Neutral</Tag>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.featureCard}>
              <TeamOutlined className={styles.featureIconBlue} />
              <Title level={4} className={styles.featureTitle}>Community Impact</Title>
              <Paragraph className={styles.featureDescription}>
                Track collective environmental achievements across communities
              </Paragraph>
              <Tag color="blue" className={styles.tagSmall}>Social Good</Tag>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Certificate Interface */}
      <div className={styles.certificateSection}>
        <Card className={styles.certificateCard}>
          <div className={styles.certificateContent}>
            <BlockOutlined className={styles.certificateIcon} />
            <Title level={3} className={styles.certificateTitle}>
              Blockchain Certificate Platform
            </Title>
            <Paragraph className={styles.certificateDescription}>
              Mint, trade, and verify NFT-based environmental certificates. Each certificate represents
              verified waste processing achievements with immutable blockchain proof.
            </Paragraph>
            <Space size="large">
              <Button 
                type="primary" 
                size="large"
                icon={<BlockOutlined />}
                className={styles.mintButton}
              >
                Mint New Certificate
              </Button>
              <Button 
                size="large"
                icon={<GlobalOutlined />}
                className={styles.browseButton}
              >
                Browse Marketplace
              </Button>
            </Space>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <Title level={4} className={styles.footerTitle}>
            ⛓️ Blockchain-Powered Sustainability
          </Title>
          <Paragraph className={styles.footerDescription}>
            Leveraging Polygon network for transparent, immutable environmental certificates
          </Paragraph>
          <Space size="large">
            <Button type="text" className={styles.footerButton} icon={<LockOutlined />}>
              Immutable
            </Button>
            <Button type="text" className={styles.footerButton} icon={<GlobalOutlined />}>
              Transparent
            </Button>
            <Button type="text" className={styles.footerButton} icon={<DollarOutlined />}>
              Tradable
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default BlockchainCertificates;
