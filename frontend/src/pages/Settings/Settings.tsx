import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Row, Col, Tag } from 'antd';
import { Card as AntCard } from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  UserOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  BulbOutlined
} from '@ant-design/icons';
import styles from './Settings.module.css';

const { Title, Paragraph } = Typography;

const Settings: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.settingsPage}>
      {/* Animated Background Elements */}
      <div className={styles.floatingCircle1} />
      <div className={styles.floatingCircle2} />
      <div className={styles.floatingCircle3} />

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroCard}>
          {/* Live Time Display */}
          <div className={styles.timeDisplay}>
            {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
          </div>

          <Title level={1} className={styles.heroTitle}>
            ⚙️ System Settings
          </Title>

          <Title level={3} className={styles.heroSubtitle}>
            Configurable • Secure • Optimized
          </Title>

          <Paragraph className={styles.heroDescription}>
            Comprehensive configuration panel for system preferences, user settings, sensor calibration,
            and integration parameters. Customize your waste management system to perfection.
          </Paragraph>

          <Space size="large">
            <div className={styles.buttonGradientWrapper}>
              <Button
                type="primary"
                size="large"
                icon={<SettingOutlined />}
                className={styles.primaryButton}
              >
                Open Settings
              </Button>
            </div>
            <Button
              size="large"
              icon={<SaveOutlined />}
              className={styles.secondaryButton}
            >
              Save Changes
            </Button>
          </Space>

          {/* Key Stats */}
          <Row gutter={[32, 24]} justify="center" className={styles.statsRow}>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueGreen}>
                  12
                </div>
                <div className={styles.statLabel}>Active Users</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueBlue}>
                  8
                </div>
                <div className={styles.statLabel}>System Modules</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValueOrange}>
                  95%
                </div>
                <div className={styles.statLabel}>Config Health</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className={styles.statItem}>
                <div className={styles.statValuePink}>
                  <SyncOutlined spin />
                </div>
                <div className={styles.statLabel}>Auto-Sync</div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* System Status Alert */}
      <div className={styles.statusAlertWrapper}>
        <div className={styles.statusAlert}>
          <CheckCircleOutlined className={styles.statusIcon} />
          <div>
            <div className={styles.statusTitle}>
              ⚙️ Configuration System Active
            </div>
            <div className={styles.statusDescription}>
              All settings synchronized, auto-backup enabled, configuration validation passed.
            </div>
          </div>
        </div>
      </div>

      {/* Settings Categories */}
      <div className={styles.categoriesSection}>
        <div className={styles.sectionHeader}>
          <Title level={2} className={styles.sectionTitle}>
            ⚙️ Configuration Categories
          </Title>
          <Paragraph className={styles.sectionSubtitle}>
            Comprehensive settings management across all system modules and user preferences
          </Paragraph>
        </div>

        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <AntCard className={styles.categoryCard}>
              <UserOutlined className={styles.categoryIconBlue} />
              <Title level={4} className={styles.categoryTitle}>User Preferences</Title>
              <Paragraph className={styles.categoryDescription}>
                Personal settings, notifications, and interface customization
              </Paragraph>
              <Tag color="blue" className={styles.categoryTag}>Personal</Tag>
            </AntCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <AntCard className={styles.categoryCard}>
              <SafetyOutlined className={styles.categoryIconGreen} />
              <Title level={4} className={styles.categoryTitle}>Security & Access</Title>
              <Paragraph className={styles.categoryDescription}>
                Authentication, permissions, and security configurations
              </Paragraph>
              <Tag color="green" className={styles.categoryTag}>Security</Tag>
            </AntCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <AntCard className={styles.categoryCard}>
              <DatabaseOutlined className={styles.categoryIconOrange} />
              <Title level={4} className={styles.categoryTitle}>System Configuration</Title>
              <Paragraph className={styles.categoryDescription}>
                Database, performance, and system-wide settings
              </Paragraph>
              <Tag color="orange" className={styles.categoryTag}>System</Tag>
            </AntCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <AntCard className={styles.categoryCard}>
              <ExperimentOutlined className={styles.categoryIconPurple} />
              <Title level={4} className={styles.categoryTitle}>Sensor Calibration</Title>
              <Paragraph className={styles.categoryDescription}>
                Multi-modal sensor configuration and calibration settings
              </Paragraph>
              <Tag color="purple" className={styles.categoryTag}>Sensors</Tag>
            </AntCard>
          </Col>
        </Row>
      </div>

      {/* Main Settings Interface */}
      <div className={styles.mainInterfaceWrapper}>
        <AntCard className={styles.mainCard}>
          <div className={styles.mainCardContent}>
            <SettingOutlined className={styles.mainIcon} />
            <Title level={3} className={styles.mainTitle}>
              Advanced Configuration Panel
            </Title>
            <Paragraph className={styles.mainDescription}>
              Comprehensive settings management for user preferences, system configuration,
              sensor calibration, and integration parameters. All changes are automatically validated and backed up.
            </Paragraph>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<SettingOutlined />}
                className={styles.accessButton}
              >
                Access Settings
              </Button>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                className={styles.resetButton}
              >
                Reset to Default
              </Button>
            </Space>
          </div>
        </AntCard>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <Title level={4} className={styles.footerTitle}>
            ⚙️ Intelligent Configuration
          </Title>
          <Paragraph className={styles.footerDescription}>
            Smart settings management with auto-validation and real-time synchronization
          </Paragraph>
          <Space size="large">
            <Button
              type="text"
              className={styles.footerButton}
              icon={<SafetyOutlined />}
            >
              Secure
            </Button>
            <Button
              type="text"
              className={styles.footerButton}
              icon={<SyncOutlined />}
            >
              Auto-Sync
            </Button>
            <Button
              type="text"
              className={styles.footerButton}
              icon={<BulbOutlined />}
            >
              Smart Defaults
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default Settings;