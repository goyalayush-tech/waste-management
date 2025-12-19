import { useEffect, useState } from 'react';
import { Typography, Button, Input, Tag, Space, Row, Col, Spin, List, message } from 'antd';
import { Card as AntCard } from 'antd';
import styles from './AuditorConsole.module.css';
import {
  AuditOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { listAuditTasks, queueFieldAudit, completeFieldAudit } from '../api';
import type { AuditTask } from '../types';

const { Title, Text } = Typography;

// Field-audit selection rule (added)
// Select for field audit if low score or random sample
// const needsFieldAudit = data.score < VERIFIED_THRESHOLD || Math.random() < 0.10;
// TODO: if (needsFieldAudit) create AuditTask { type:'field', status:'queued' }

export default function AuditorConsole() {
  const [tasks, setTasks] = useState<AuditTask[]>([]);
  const [claimId, setClaimId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await listAuditTasks();
      setTasks(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit tasks');
      message.error('Failed to load audit tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleQueueFieldAudit = async () => {
    try {
      setError(null);
      setLoading(true);
      if (!claimId) {
        setError('Claim ID required to queue field audit');
        message.error('Claim ID is required');
        return;
      }
      await queueFieldAudit({ claimId, assignedTo: assignedTo || undefined });
      setStatusMessage('Field audit queued successfully');
      setClaimId('');
      setAssignedTo('');
      message.success('Field audit queued successfully');
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue field audit');
      message.error('Failed to queue field audit');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (task: AuditTask) => {
    try {
      setError(null);
      setLoading(true);
      await completeFieldAudit(task._id, { claimStatus: 'verified' });
      setStatusMessage('Field audit marked as complete');
      message.success('Field audit marked as complete');
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete field audit');
      message.error('Failed to complete field audit');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'success';
      case 'running': return 'processing';
      case 'queued': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircleOutlined />;
      case 'running': return <ClockCircleOutlined />;
      case 'queued': return <ClockCircleOutlined />;
      case 'failed': return <ExclamationCircleOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Animated Background Elements */}
      <div className={styles.floatingCircle1} />
      <div className={styles.floatingCircle2} />
      <div className={styles.floatingCircle3} />

      <div className={styles.contentWrapper}>
        <div className={styles.contentContainer}>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <Title level={1} className={styles.pageTitle}>
              <AuditOutlined className={styles.pageTitleIcon} />
              Auditor Console
            </Title>
            <Text className={styles.pageSubtitle}>
              Manage and oversee ClaimClean audit processes
            </Text>
          </div>

          <Row gutter={[24, 24]}>
            {/* Queue Field Audit */}
            <Col xs={24} lg={12}>
              <AntCard className={styles.card}>
                <div className={styles.cardContent}>
                  <Title level={3} className={styles.cardTitle}>
                    <PlusOutlined className={styles.cardTitleIcon} />
                    Queue Field Audit
                  </Title>

                  <div className={styles.formGroup}>
                    <Text strong className={styles.formLabel}>Claim ID</Text>
                    <Input
                      value={claimId}
                      onChange={(e) => setClaimId(e.target.value)}
                      placeholder="Enter claim ObjectId"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroupLarge}>
                    <Text strong className={styles.formLabel}>Assign To (optional)</Text>
                    <Input
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      placeholder="auditor@claimclean"
                      className={styles.formInput}
                    />
                  </div>

                  <Button
                    type="primary"
                    onClick={handleQueueFieldAudit}
                    loading={loading}
                    disabled={!claimId}
                    size="large"
                    className={styles.primaryButton}
                  >
                    Queue Audit
                  </Button>
                </div>
              </AntCard>
            </Col>

            {/* Audit Statistics */}
            <Col xs={24} lg={12}>
              <AntCard className={styles.card}>
                <div className={styles.cardContent}>
                  <Title level={3} className={styles.cardTitle}>
                    <AuditOutlined className={styles.cardTitleIcon} />
                    Audit Overview
                  </Title>

                  <Space direction="vertical" size="large" className={styles.fullWidth}>
                    <div className={styles.statsRow}>
                      <Text strong>Total Tasks:</Text>
                      <Text className={styles.statValue}>{tasks.length}</Text>
                    </div>

                    <div className={styles.statsRow}>
                      <Text strong>Completed:</Text>
                      <Text className={styles.statValueGreen}>
                        {tasks.filter(t => t.status === 'complete').length}
                      </Text>
                    </div>

                    <div className={styles.statsRow}>
                      <Text strong>In Progress:</Text>
                      <Text className={styles.statValueOrange}>
                        {tasks.filter(t => t.status === 'running').length}
                      </Text>
                    </div>

                    <div className={styles.statsRow}>
                      <Text strong>Queued:</Text>
                      <Text className={styles.statValueGray}>
                        {tasks.filter(t => t.status === 'queued').length}
                      </Text>
                    </div>
                  </Space>
                </div>
              </AntCard>
            </Col>

            {/* Audit Tasks List */}
            <Col span={24}>
              <AntCard className={styles.card}>
                <div className={styles.cardContent}>
                  <Title level={3} className={styles.cardTitle}>
                    <FileTextOutlined className={styles.cardTitleIcon} />
                    Audit Tasks
                  </Title>

                  {loading ? (
                    <div className={styles.loadingWrapper}>
                      <Spin size="large" />
                    </div>
                  ) : tasks.length ? (
                    <List
                      dataSource={tasks}
                      renderItem={(task) => (
                        <List.Item className={styles.listItem}>
                          <div className={styles.listItemContent}>
                            <div className={styles.listItemHeader}>
                              <div className={styles.listItemInfo}>
                                {getStatusIcon(task.status)}
                                <Text strong className={styles.listItemTitle}>
                                  {task.type.charAt(0).toUpperCase() + task.type.slice(1)} Audit
                                </Text>
                              </div>
                              <Tag color={getStatusColor(task.status)} className={styles.tagSmall}>
                                {task.status.toUpperCase()}
                              </Tag>
                            </div>

                            <div className={styles.listItemMeta}>
                              <Text className={styles.listItemMetaText}>
                                Claim ID: {task.claimId}
                              </Text>
                            </div>

                            {task.assignedTo && (
                              <div className={styles.listItemMeta}>
                                <UserOutlined className={styles.listItemMetaIcon} />
                                <Text className={styles.listItemMetaText}>
                                  Assigned to: {task.assignedTo}
                                </Text>
                              </div>
                            )}

                            {task.result?.score !== undefined && (
                              <div className={styles.listItemMeta}>
                                <Text strong>Audit Score: </Text>
                                <Text className={task.result.score > 80 ? styles.scoreGreen : task.result.score > 60 ? styles.scoreOrange : styles.scoreRed}>
                                  {task.result.score}/100
                                </Text>
                              </div>
                            )}

                            {task.status !== 'complete' && task.type === 'field' && (
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => handleComplete(task)}
                                loading={loading}
                                className={styles.completeButton}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className={styles.emptyState}>
                      <FileTextOutlined className={styles.emptyIcon} />
                      <Title level={4} className={styles.emptyTitle}>
                        No Audit Tasks
                      </Title>
                      <Text className={styles.emptyText}>
                        No audit tasks have been created yet. Queue a field audit to get started.
                      </Text>
                    </div>
                  )}
                </div>
              </AntCard>
            </Col>
          </Row>

          {/* Status Messages */}
          {statusMessage && (
            <div className={styles.successMessage}>
              <CheckCircleOutlined className={styles.successIcon} />
              <Text className={styles.successText}>{statusMessage}</Text>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <ExclamationCircleOutlined className={styles.errorIcon} />
              <Text className={styles.errorText}>{error}</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}