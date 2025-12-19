import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Typography, Button, Tag, Row, Col, Spin, Descriptions, List, Divider, Card } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AuditOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { fetchClaim, fetchAuditReport, listAuditTasks } from '../api';
import type { Claim, AuditTask } from '../types';
import styles from './ClaimDetail.module.css';

const { Title, Text } = Typography;

export default function ClaimDetail() {
  const { claimId } = useParams();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [tasks, setTasks] = useState<AuditTask[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!claimId) return;
      try {
        setLoading(true);
        const claimResp = await fetchClaim(claimId);
        setClaim(claimResp.data);

        try {
          const reportResp = await fetchAuditReport(claimId);
          setReport(reportResp.data);
        } catch (reportErr) {
          console.warn('ClaimClean report fetch failed', reportErr);
        }

        try {
          const tasksResp = await listAuditTasks();
          setTasks(tasksResp.data.filter((task) => task.claimId === claimId));
        } catch (tasksErr) {
          console.warn('ClaimClean audit tasks fetch failed', tasksErr);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch claim');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [claimId]);

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

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
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
          <Title level={3} className={styles.errorTitle}>Error Loading Claim</Title>
          <Text className={styles.errorText}>{error}</Text>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <InfoCircleOutlined className={styles.errorIcon} />
          <Title level={3} className={styles.errorTitle}>Claim Not Found</Title>
          <Text className={styles.errorText}>The requested claim could not be found.</Text>
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

      <div className={styles.mainContent}>
        <div className={styles.maxWidthContainer}>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              className={styles.backButton}
            >
              <Link to="/app/claimclean" className={styles.backButtonLink}>Back to Claims</Link>
            </Button>

            <div className={styles.headerRow}>
              <div>
                <Title level={1} className={styles.headerTitle}>
                  <FileTextOutlined style={{ marginRight: '12px' }} />
                  Claim: {claim.brandId}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                  {claim.brandId} → {claim.recyclerId}
                </Text>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getStatusIcon(claim.status)}
                <Tag
                  color={getStatusColor(claim.status)}
                  style={{
                    fontSize: '14px',
                    padding: '6px 12px',
                    borderRadius: '20px'
                  }}
                >
                  {claim.status.toUpperCase()}
                </Tag>
              </div>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            {/* Claim Summary */}
            <Col xs={24} lg={12}>
              <Card className={styles.card}>
                <div className={styles.cardContent}>
                  <Title level={3} className={styles.cardTitle}>
                    <InfoCircleOutlined style={{ marginRight: '8px' }} />
                    Claim Summary
                  </Title>

                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Brand ID">{claim.brandId}</Descriptions.Item>
                    <Descriptions.Item label="Recycler ID">{claim.recyclerId}</Descriptions.Item>
                    <Descriptions.Item label="Facility ID">{claim.facilityId}</Descriptions.Item>
                    <Descriptions.Item label="Claimed Weight">{claim.claimedWeightKg} kg</Descriptions.Item>
                    <Descriptions.Item label="Period">
                      {new Date(claim.period.from).toLocaleDateString()} - {new Date(claim.period.to).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">{new Date(claim.createdAt).toLocaleString()}</Descriptions.Item>
                  </Descriptions>
                </div>
              </Card>
            </Col>

            {/* Audit Results */}
            <Col xs={24} lg={12}>
              <Card className={styles.card}>
                <div className={styles.cardContent}>
                  <Title level={3} className={styles.cardTitle}>
                    <AuditOutlined style={{ marginRight: '8px' }} />
                    Audit Results
                  </Title>

                  {claim.audit ? (
                    <div>
                      <div className={styles.scoreContainer}>
                        <div className={styles.scoreValue} style={{
                          color: (claim.audit.score ?? 0) > 80 ? '#10b981' : (claim.audit.score ?? 0) > 60 ? '#f59e0b' : '#ef4444'
                        }}>
                          {(claim.audit.score ?? 0)}/100
                        </div>
                        <Text className={styles.scoreLabel}>Audit Score</Text>
                      </div>

                      <Divider />

                      <div>
                        <Title level={4} className={styles.issuesTitle}>
                          Issues Found
                        </Title>
                        {claim.audit.issues?.length ? (
                          <List
                            size="small"
                            dataSource={claim.audit.issues}
                            renderItem={(issue) => (
                              <List.Item className={styles.issueItem}>
                                <div className={styles.issueContent}>
                                  <WarningOutlined style={{ color: getSeverityColor(issue.severity), marginTop: '2px' }} />
                                  <div>
                                    <Text strong style={{ color: getSeverityColor(issue.severity) }}>
                                      [{issue.severity.toUpperCase()}] {issue.code}
                                    </Text>
                                    <br />
                                    <Text className={styles.issueMessage}>{issue.message}</Text>
                                  </div>
                                </div>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <div className={styles.noIssuesContainer}>
                            <CheckCircleOutlined className={styles.noIssuesIcon} />
                            <Text className={styles.noIssuesText}>No issues found</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <ClockCircleOutlined className={styles.emptyIcon} />
                      <Title level={4} className={styles.emptyTitle}>
                        Audit Not Run
                      </Title>
                      <Text className={styles.emptyText}>
                        This claim has not been audited yet.
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* Verification Report */}
            <Col span={24}>
              <Card className={styles.card}>
                <div className={styles.cardContent}>
                  <Title level={3} className={styles.cardTitle}>
                    <FileTextOutlined style={{ marginRight: '8px' }} />
                    Verification Report
                  </Title>

                  {report ? (
                    <div className={styles.reportContainer}>
                      <pre className={styles.reportCode}>
                        {JSON.stringify(report, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <InfoCircleOutlined className={styles.emptyIcon} />
                      <Title level={4} className={styles.emptyTitle}>
                        Report Not Available
                      </Title>
                      <Text className={styles.emptyText}>
                        The verification report is not available for this claim.
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* Audit Tasks */}
            <Col span={24}>
              <Card className={styles.card}>
                <div className={styles.cardContent}>
                  <Title level={3} className={styles.cardTitle}>
                    <AuditOutlined style={{ marginRight: '8px' }} />
                    Audit Tasks
                  </Title>

                  {tasks.length ? (
                    <List
                      dataSource={tasks}
                      renderItem={(task) => (
                        <List.Item className={styles.taskItem}>
                          <div className={styles.taskContent}>
                            <div className={styles.taskHeader}>
                              <Text strong className={styles.taskTitle}>
                                {task.type.charAt(0).toUpperCase() + task.type.slice(1)} Audit
                              </Text>
                              <Tag color={getStatusColor(task.status)}>{task.status.toUpperCase()}</Tag>
                            </div>

                            {task.result?.score !== undefined && (
                              <div className={styles.taskScore}>
                                <Text strong>Score: </Text>
                                <Text style={{ color: task.result.score > 80 ? '#10b981' : task.result.score > 60 ? '#f59e0b' : '#ef4444' }}>
                                  {task.result.score}/100
                                </Text>
                              </div>
                            )}

                            {task.result?.issues?.length && (
                              <div>
                                <Text strong className={styles.taskIssuesHeader}>Issues:</Text>
                                <List
                                  size="small"
                                  dataSource={task.result.issues}
                                  renderItem={(issue) => (
                                    <List.Item className={styles.taskIssueItem}>
                                      <Text style={{ fontSize: '12px', color: getSeverityColor(issue.severity) }}>
                                        [{issue.severity}] {issue.code}: {issue.message}
                                      </Text>
                                    </List.Item>
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className={styles.emptyState}>
                      <ClockCircleOutlined className={styles.emptyIcon} />
                      <Title level={4} className={styles.emptyTitle}>
                        No Audit Tasks
                      </Title>
                      <Text className={styles.emptyText}>
                        No audit tasks have been recorded for this claim yet.
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}
