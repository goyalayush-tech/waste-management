import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Button, Table, Tag, Progress, Alert, Spin, message } from 'antd';
import {
  AuditOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  RocketOutlined,
  BulbOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Claim } from '../types';
import { 
  fetchDashboardStats, 
  fetchClaims, 
  type DashboardStats 
} from '../api';
import styles from './ClaimCleanDashboard.module.css';

const { Title, Text } = Typography;

// Fallback mock data for when API is not available
const mockStats: DashboardStats = {
  totalClaims: 0,
  verifiedClaims: 0,
  pendingClaims: 0,
  rejectedClaims: 0,
  auditingClaims: 0,
  totalWeightKg: 0,
  totalWeightTonnes: '0',
  averageScore: 0,
  pendingAudits: 0,
  fieldAudits: 0,
  openIssues: 0
};

const ClaimCleanDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // Update time every second for live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data from real API
  const fetchData = async (showRefreshMessage = false) => {
    try {
      if (showRefreshMessage) {
        setRefreshing(true);
      }
      setError(null);

      // Fetch stats and claims in parallel
      const [statsResult, claimsResult] = await Promise.all([
        fetchDashboardStats().catch(() => ({ success: false, data: mockStats })),
        fetchClaims().catch(() => ({ success: false, data: [] }))
      ]);

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        console.warn('Using fallback stats - API may not be available');
        setStats(mockStats);
      }

      if (claimsResult.success) {
        // Get the 5 most recent claims
        setRecentClaims(claimsResult.data.slice(0, 5));
      }

      if (showRefreshMessage) {
        message.success('Dashboard refreshed');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Unable to connect to server. Showing cached data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'auditing': return 'processing';
      case 'submitted': return 'default';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return '#8c8c8c';
    if (score >= 75) return '#52c41a';
    if (score >= 50) return '#faad14';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: 'Claim ID',
      dataIndex: '_id',
      key: '_id',
      render: (id: string) => (
        <Button
          type="link"
          onClick={() => navigate(`/app/claimclean/claims/${id}`)}
          className={styles.claimIdLink}
        >
          {id}
        </Button>
      ),
    },
    {
      title: 'Brand',
      dataIndex: 'brandId',
      key: 'brandId',
      render: (text: string) => <Text className={styles.tableTextDefault}>{text}</Text>,
    },
    {
      title: 'Recycler',
      dataIndex: 'recyclerId',
      key: 'recyclerId',
      render: (text: string) => <Text className={styles.tableTextDefault}>{text}</Text>,
    },
    {
      title: 'Weight (kg)',
      dataIndex: 'claimedWeightKg',
      key: 'claimedWeightKg',
      render: (weight: number) => <Text className={styles.tableTextBold}>{weight.toLocaleString()}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className={styles.tagBold}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      render: (record: Claim) => {
        const score = record.audit?.score;
        return score ? (
          <Text style={{ color: getScoreColor(score) }} className={styles.scoreBold}>
            {score}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => <Text className={styles.tableTextMuted}>{new Date(date).toLocaleDateString()}</Text>,
    },
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingBubble} />
        <Spin size="large" className={styles.loadingSpinnerWhite} />
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      {/* Animated Background Elements */}
      <div className={styles.bgBubble1} />
      <div className={styles.bgBubble2} />
      <div className={styles.bgBubble3} />

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroCard}>
          {/* Live Time Display */}
          <div className={styles.timeDisplay}>
            {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
          </div>

          <Title level={1} className={styles.heroTitle}>
            🌱 ClaimClean Dashboard
          </Title>

          <Title level={3} className={styles.heroSubtitle}>
            EPR Verification • Blockchain-Powered • AI-Driven
          </Title>

          <Space size="large">
            <div className={styles.newClaimButtonWrapper}>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/app/claimclean/claims/new')}
                className={styles.newClaimButton}
              >
                New Claim
              </Button>
            </div>
            <Button
              size="large"
              icon={<BulbOutlined />}
              onClick={() => navigate('/app/claimclean/reports')}
              className={styles.reportsButton}
            >
              View Reports
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => fetchData(true)}
              loading={refreshing}
              className={styles.refreshButton}
            >
              Refresh
            </Button>
          </Space>

          {/* Error Alert */}
          {error && (
            <Alert
              message={error}
              type="warning"
              showIcon
              className={styles.errorAlert}
              closable
              onClose={() => setError(null)}
            />
          )}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <Title level={2} className={styles.sectionTitle}>
            📊 Key Performance Metrics
          </Title>
          <Text className={styles.sectionSubtitle}>
            Real-time monitoring of EPR compliance verification
          </Text>
        </div>

        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className={styles.statCard}>
              <Statistic
                title={<span className={styles.statCardTitle}>Total Claims</span>}
                value={stats.totalClaims}
                valueStyle={{ color: '#667eea', fontSize: '28px', fontWeight: 800 }}
                prefix={<FileTextOutlined className={styles.iconPrimary} />}
              />
              <Progress
                percent={Math.round((stats.totalClaims / 300) * 100)}
                size="small"
                showInfo={false}
                strokeColor="#667eea"
                className={styles.progressMarginTop}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className={styles.statCard}>
              <Statistic
                title={<span className={styles.statCardTitle}>Verified Claims</span>}
                value={stats.verifiedClaims}
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 800 }}
                prefix={<CheckCircleOutlined className={styles.iconSuccess} />}
              />
              <Progress
                percent={Math.round((stats.verifiedClaims / stats.totalClaims) * 100)}
                size="small"
                showInfo={false}
                strokeColor="#52c41a"
                className={styles.progressMarginTop}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className={styles.statCard}>
              <Statistic
                title={<span className={styles.statCardTitle}>Average Score</span>}
                value={stats.averageScore}
                precision={1}
                valueStyle={{
                  color: stats.averageScore >= 75 ? '#52c41a' : stats.averageScore >= 50 ? '#faad14' : '#ff4d4f',
                  fontSize: '28px',
                  fontWeight: 800
                }}
                prefix={<TrophyOutlined style={{
                  color: stats.averageScore >= 75 ? '#52c41a' : stats.averageScore >= 50 ? '#faad14' : '#ff4d4f',
                  fontSize: '20px'
                }} />}
                suffix={
                  <Progress
                    percent={stats.averageScore}
                    size="small"
                    showInfo={false}
                    strokeColor={stats.averageScore >= 75 ? '#52c41a' : stats.averageScore >= 50 ? '#faad14' : '#ff4d4f'}
                  />
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className={styles.statCard}>
              <Statistic
                title={<span className={styles.statCardTitle}>Pending Audits</span>}
                value={stats.pendingAudits}
                valueStyle={{ color: '#faad14', fontSize: '28px', fontWeight: 800 }}
                prefix={<ClockCircleOutlined className={styles.iconWarning} />}
              />
              <Progress
                percent={Math.round((stats.pendingAudits / 50) * 100)}
                size="small"
                showInfo={false}
                strokeColor="#faad14"
                className={styles.progressMarginTop}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Secondary KPIs */}
      <div className={styles.sectionContainer}>
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12}>
            <Card className={styles.statCard}>
              <Statistic
                title={<span className={styles.statCardTitle}>Open Issues</span>}
                value={stats.openIssues}
                valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: 800 }}
                prefix={<ExclamationCircleOutlined className={styles.iconDanger} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card className={styles.statCard}>
              <Statistic
                title={<span className={styles.statCardTitle}>Field Audits</span>}
                value={stats.fieldAudits}
                valueStyle={{ color: '#0284C7', fontSize: '28px', fontWeight: 800 }}
                prefix={<TeamOutlined className={styles.iconInfo} />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Quick Actions */}
      <div className={styles.sectionContainer}>
        <Card
          title={<span className={styles.cardTitle}>🚀 Quick Actions</span>}
          className={styles.quickActionsCard}
          extra={
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={() => navigate('/app/claimclean/claims/new')}
              className={styles.newClaimButtonSmall}
            >
              New Claim
            </Button>
          }
        >
          <Space wrap size="middle">
            <Button
              icon={<FileTextOutlined />}
              onClick={() => navigate('/app/claimclean/claims')}
              className={styles.actionButton}
            >
              View All Claims
            </Button>
            <Button
              icon={<AuditOutlined />}
              onClick={() => navigate('/app/claimclean/audits/console')}
              className={styles.actionButton}
            >
              AI Audit Queue
            </Button>
            <Button
              icon={<TeamOutlined />}
              onClick={() => navigate('/app/claimclean/audits/field')}
              className={styles.actionButton}
            >
              Field Audits
            </Button>
            <Button
              icon={<TrophyOutlined />}
              onClick={() => navigate('/app/claimclean/reports')}
              className={styles.actionButton}
            >
              Reports
            </Button>
          </Space>
        </Card>
      </div>

      {/* Alert for low scoring claims */}
      {stats.averageScore < 70 && (
        <div className={styles.sectionContainer}>
          <Alert
            message={<span className={styles.alertTitle}>⚠️ Attention: Average Score Below Threshold</span>}
            description="The average verification score has dropped below 70. Consider reviewing recent claims and audit processes."
            type="warning"
            showIcon
            className={styles.alertCard}
          />
        </div>
      )}

      {/* Recent Claims Table */}
      <div className={styles.sectionContainerNoMargin}>
        <Card
          title={<span className={styles.cardTitle}>📋 Recent Claims</span>}
          className={styles.tableCard}
          extra={
            <Button
              type="link"
              onClick={() => navigate('/app/claimclean/claims')}
              className={styles.viewAllLink}
            >
              View All →
            </Button>
          }
        >
          <Table
            dataSource={recentClaims}
            columns={columns}
            rowKey="_id"
            pagination={false}
            size="middle"
            className={styles.tableTransparent}
          />
        </Card>
      </div>
    </div>
  );
};

export default ClaimCleanDashboard;