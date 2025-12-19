import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Statistic, 
  Progress, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Select, 
  Alert,
  Tabs,
  List,
  Avatar,
  Badge
} from 'antd';
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { eprClient } from '@/services/api';
import PageHeader from '@/components/Shared/PageHeader';
import ErrorBoundary from '@/components/Shared/ErrorBoundary';
import { AuditResult } from '@/services/api/eprClient';
import styles from './ComplianceDashboard.module.css';

const { Text } = Typography;
const { TabPane } = Tabs;

interface ComplianceMetrics {
  overview: {
    averageScore: number;
    totalAudits: number;
    complianceRate: number;
    timeframe: string;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  trend: Array<{
    date: string;
    score: number;
    auditCount: number;
  }>;
  recommendations: Array<{
    priority: string;
    category: string;
    message: string;
    action: string;
  }>;
}

const ComplianceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const client = eprClient();
      
      // Mock compliance metrics since getComplianceMetrics doesn't exist
      const mockMetrics: ComplianceMetrics = {
        overview: {
          averageScore: 85,
          totalAudits: 24,
          complianceRate: 92,
          timeframe: timeframe
        },
        riskDistribution: {
          low: 15,
          medium: 5,
          high: 3,
          critical: 1
        },
        trend: [
          { date: '2024-01', score: 82, auditCount: 2 },
          { date: '2024-02', score: 85, auditCount: 2 },
          { date: '2024-03', score: 88, auditCount: 2 }
        ],
        recommendations: [
          {
            priority: 'high',
            category: 'Documentation',
            message: 'Missing EPR certificates for 3 documents',
            action: 'Upload required certificates'
          }
        ]
      };
      
      const historyRes = await client.getAuditHistory({ limit: 50 });

      setMetrics(mockMetrics);
      setAuditHistory(historyRes.audits);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      case 'critical': return 'purple';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'high': return <WarningOutlined style={{ color: '#fa8c16' }} />;
      case 'medium': return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default: return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const auditHistoryColumns = [
    {
      title: 'Document ID',
      dataIndex: 'documentId',
      key: 'documentId',
      render: (text: string) => (
        <Text code copyable={{ text }}>{text.substring(0, 8)}...</Text>
      )
    },
    {
      title: 'Type',
      dataIndex: 'auditType',
      key: 'auditType',
      render: (type: string) => (
        <Tag>{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>
      )
    },
    {
      title: 'Score',
      dataIndex: 'overallScore',
      key: 'overallScore',
      render: (score: number) => (
        <div>
          <Progress 
            percent={score} 
            size="small" 
            status={score < 60 ? 'exception' : score < 80 ? 'normal' : 'success'}
            format={(percent) => `${percent}`}
          />
        </div>
      )
    },
    {
      title: 'Risk Level',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (level: string) => (
        <Tag color={getRiskLevelColor(level)}>
          {level.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Findings',
      dataIndex: 'findings',
      key: 'findings',
      render: (findings: any[]) => (
        <Space>
          <Badge count={findings.filter(f => f.severity === 'critical').length} showZero={false}>
            <Tag color="red">Critical</Tag>
          </Badge>
          <Badge count={findings.filter(f => f.severity === 'high').length} showZero={false}>
            <Tag color="orange">High</Tag>
          </Badge>
          <Badge count={findings.filter(f => f.severity === 'medium').length} showZero={false}>
            <Tag color="yellow">Medium</Tag>
          </Badge>
        </Space>
      )
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button size="small" type="link" icon={<FileSearchOutlined />}>
            View Details
          </Button>
        </Space>
      )
    }
  ];

  const renderOverviewTab = () => {
    if (!metrics) return null;

    const { overview, riskDistribution } = metrics;

    const riskData = [
      { type: 'Low Risk', value: riskDistribution.low, color: '#52c41a' },
      { type: 'Medium Risk', value: riskDistribution.medium, color: '#faad14' },
      { type: 'High Risk', value: riskDistribution.high, color: '#fa8c16' },
      { type: 'Critical Risk', value: riskDistribution.critical, color: '#ff4d4f' }
    ];

    return (
      <div className={styles.complianceDashboard}>
        {/* Key Metrics Cards */}
        <Row gutter={[16, 16]} className={styles.metricsRow}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="ClaimClean Score"
                value={overview.averageScore}
                suffix="/100"
                valueStyle={{ 
                  color: overview.averageScore >= 80 ? '#3f8600' : 
                         overview.averageScore >= 60 ? '#faad14' : '#cf1322' 
                }}
                prefix={<SafetyCertificateOutlined />}
              />
              <Progress 
                percent={overview.averageScore} 
                showInfo={false} 
                strokeColor={
                  overview.averageScore >= 80 ? '#52c41a' :
                  overview.averageScore >= 60 ? '#faad14' : '#ff4d4f'
                }
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Audits"
                value={overview.totalAudits}
                prefix={<FileSearchOutlined />}
              />
              <Text type="secondary">Last {timeframe}</Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Compliance Rate"
                value={overview.complianceRate}
                suffix="%"
                valueStyle={{ 
                  color: overview.complianceRate >= 90 ? '#3f8600' : '#faad14' 
                }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Critical Issues"
                value={riskDistribution.critical}
                valueStyle={{ color: riskDistribution.critical > 0 ? '#cf1322' : '#3f8600' }}
                prefix={<ExclamationCircleOutlined />}
              />
              <Text type="secondary">Require immediate attention</Text>
            </Card>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={[16, 16]} className={styles.chartsRow}>
          <Col xs={24} lg={16}>
            <Card title="Compliance Score Trend" extra={
              <Select value={timeframe} onChange={setTimeframe} size="small">
                <Select.Option value="7d">Last 7 days</Select.Option>
                <Select.Option value="30d">Last 30 days</Select.Option>
                <Select.Option value="90d">Last 90 days</Select.Option>
              </Select>
            }>
              <div className={styles.chartPlaceholder} style={{ height: 300 }}>
                <Text>Compliance Score Trend Chart</Text>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card title="Risk Distribution">
              {riskData.some(d => d.value > 0) ? (
                <div className={styles.chartPlaceholder} style={{ height: 300 }}>
                  <Text>Risk Distribution Chart</Text>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <CheckCircleOutlined className={styles.emptyIcon} />
                  <div className={styles.emptyText}>
                    <Text>No risk issues detected</Text>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Recommendations */}
        {metrics.recommendations.length > 0 && (
          <Card title="Recommendations" className={styles.recommendationsCard}>
            <List
              dataSource={metrics.recommendations}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: item.priority === 'critical' ? '#ff4d4f' : 
                                          item.priority === 'high' ? '#fa8c16' : '#faad14' 
                        }}
                      >
                        {getSeverityIcon(item.priority)}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text strong>{item.message}</Text>
                        <Tag color={
                          item.priority === 'critical' ? 'red' : 
                          item.priority === 'high' ? 'orange' : 'gold'
                        }>
                          {item.priority.toUpperCase()}
                        </Tag>
                      </Space>
                    }
                    description={item.action}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>
    );
  };

  const renderAuditHistoryTab = () => (
    <Card title="Audit History" extra={
      <Space>
        <Button type="primary" icon={<FileSearchOutlined />}>
          New Audit
        </Button>
        <Button>Export Report</Button>
      </Space>
    }>
      <Table
        columns={auditHistoryColumns}
        dataSource={auditHistory}
        rowKey="id"
        pagination={{
          total: auditHistory.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true
        }}
        loading={loading}
      />
    </Card>
  );

  return (
    <ErrorBoundary>
      <div className="compliance-dashboard">
        <PageHeader
          title="EPR Compliance Dashboard"
          subtitle="Monitor and manage your Extended Producer Responsibility compliance status"
          extra={[
            <Button key="refresh" onClick={loadDashboardData} loading={loading}>
              Refresh Data
            </Button>,
            <Button key="export" type="primary">
              Export Report
            </Button>
          ]}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane tab="Overview" key="overview">
            {renderOverviewTab()}
          </TabPane>
          
          <TabPane tab="Audit History" key="history">
            {renderAuditHistoryTab()}
          </TabPane>
          
          <TabPane tab="Document Upload" key="upload">
            <Card title="Upload Documents for Audit">
              <Alert
                message="Document Upload"
                description="Upload invoices, weighbridge tickets, and certificates for automated compliance auditing."
                type="info"
                showIcon
                className={styles.uploadAlert}
              />
              {/* DragDropUpload component would be used here */}
              <div className={styles.pendingFeature}>
                <Text type="secondary">Document upload component integration pending</Text>
              </div>
            </Card>
          </TabPane>
          
          <TabPane tab="Compliance Rules" key="rules">
            <Card title="Active Compliance Rules">
              <Alert
                message="Audit Rules Management"
                description="View and manage the rules used for automated compliance checking."
                type="info"
                showIcon
                className={styles.rulesAlert}
              />
              <div className={styles.pendingFeature}>
                <Text type="secondary">Rules management interface pending</Text>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default ComplianceDashboard;