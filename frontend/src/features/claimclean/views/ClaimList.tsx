import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Tag, Row, Col, Spin, Statistic, Space } from 'antd';
import { Card as AntCard } from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AuditOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { fetchClaims } from '../api';
import type { Claim } from '../types';
import styles from './ClaimList.module.css';

const { Title, Text, Paragraph } = Typography;

export default function ClaimList() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClaims = async () => {
      try {
        setLoading(true);
        const response = await fetchClaims();
        setClaims(response.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch claims');
      } finally {
        setLoading(false);
      }
    };

    loadClaims();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'auditing': return 'processing';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircleOutlined />;
      case 'auditing': return <ClockCircleOutlined />;
      case 'rejected': return <ExclamationCircleOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <ExclamationCircleOutlined className={styles.errorIcon} />
          <Title level={3} className={styles.errorTitle}>Error Loading Claims</Title>
          <Text className={styles.errorText}>{error}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Animated Background Elements */}
      <div className={styles.floatingCircle1} />
      <div className={styles.floatingCircle2} />
      <div className={styles.floatingCircle3} />

      <div className={styles.content}>
        <div className={styles.contentWrapper}>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <Title level={1} className={styles.headerTitle}>
              <AuditOutlined className={styles.headerIcon} />
              ClaimClean Audit System
            </Title>
            <Paragraph className={styles.headerSubtitle}>
              Comprehensive waste claim verification and audit management
            </Paragraph>

            <Space size="large" className={styles.statsSection}>
              <Statistic
                title={<span className={styles.statLabel}>Total Claims</span>}
                value={claims.length}
                valueStyle={{ color: 'white', fontSize: '32px' }}
                prefix={<FileTextOutlined />}
              />
              <Statistic
                title={<span className={styles.statLabel}>Verified</span>}
                value={claims.filter(c => c.status === 'verified').length}
                valueStyle={{ color: '#10b981', fontSize: '32px' }}
                prefix={<CheckCircleOutlined />}
              />
              <Statistic
                title={<span className={styles.statLabel}>Under Audit</span>}
                value={claims.filter(c => c.status === 'auditing').length}
                valueStyle={{ color: '#f59e0b', fontSize: '32px' }}
                prefix={<ClockCircleOutlined />}
              />
            </Space>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionsSection}>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                className={styles.createButton}
              >
                <Link to="/app/claimclean/new" className={styles.createButtonLink}>
                  Create New Claim
                </Link>
              </Button>
              <Button
                size="large"
                icon={<BarChartOutlined />}
                className={styles.auditorButton}
              >
                <Link to="/app/claimclean/auditor" className={styles.auditorButtonLink}>
                  Auditor Console
                </Link>
              </Button>
            </Space>
          </div>

          {/* Claims Grid */}
          <Row gutter={[24, 24]}>
            {claims.map((claim) => (
              <Col xs={24} sm={12} lg={8} key={claim._id}>
                <AntCard
                  className={styles.claimCard}
                  hoverable
                  onClick={() => window.location.href = `/app/claimclean/${claim._id}`}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                      {getStatusIcon(claim.status)}
                      <Tag
                        color={getStatusColor(claim.status)}
                        className={styles.statusTag}
                      >
                        {claim.status.toUpperCase()}
                      </Tag>
                    </div>

                    <Title level={4} className={styles.cardTitle}>
                      {claim.brandId} → {claim.recyclerId}
                    </Title>

                    <div className={styles.cardField}>
                      <Text strong>Facility: </Text>
                      <Text>{claim.facilityId}</Text>
                    </div>

                    <div className={styles.cardField}>
                      <Text strong>Weight: </Text>
                      <Text>{claim.claimedWeightKg}kg</Text>
                    </div>

                    {claim.audit?.score && (
                      <div className={styles.cardField}>
                        <Text strong>Audit Score: </Text>
                        <Text style={{ color: claim.audit.score > 80 ? '#10b981' : claim.audit.score > 60 ? '#f59e0b' : '#ef4444' }}>
                          {claim.audit.score}/100
                        </Text>
                      </div>
                    )}

                    <div className={styles.cardDate}>
                      Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </AntCard>
              </Col>
            ))}

            {claims.length === 0 && (
              <Col span={24}>
                <div className={styles.emptyState}>
                  <FileTextOutlined className={styles.emptyIcon} />
                  <Title level={3} className={styles.emptyTitle}>
                    No Claims Yet
                  </Title>
                  <Text className={styles.emptyText}>
                    Create your first waste claim to get started with the audit process.
                  </Text>
                </div>
              </Col>
            )}
          </Row>
        </div>
      </div>
    </div>
  );
}