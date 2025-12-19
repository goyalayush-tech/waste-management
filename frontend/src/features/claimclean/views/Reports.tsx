import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Button, 
  Table, 
  Tag, 
  Space,
  Input,
  Select,
  DatePicker,
  Statistic,
  Progress,
  Tooltip,
  Badge,
  message
} from 'antd';
import {
  BarChartOutlined,
  DownloadOutlined,
  EyeOutlined,
  ShareAltOutlined,
  FileTextOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  LinkOutlined
} from '@ant-design/icons';
import styles from './Reports.module.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface VerificationReport {
  id: string;
  claimId: string;
  brandId: string;
  recyclerId: string;
  score: number;
  status: 'draft' | 'final' | 'submitted';
  issuesCount: number;
  generatedAt: string;
  submittedToCPCB?: string;
  reportHash?: string;
}

// Mock reports data
const mockReports: VerificationReport[] = [
  {
    id: 'RPT-2025-001',
    claimId: 'CLM-2025-001',
    brandId: 'HUL India',
    recyclerId: 'EcoCycle Mumbai',
    score: 85,
    status: 'submitted',
    issuesCount: 1,
    generatedAt: '2025-09-25T00:00:00Z',
    submittedToCPCB: '2025-09-25T14:30:00Z',
    reportHash: '0x4f9c7e2a8b5d1f3e9c6a4b8d2e5f7a9c1e3f5b7d9e1c3f5a7b9d1e3f5c7a9bee12'
  },
  {
    id: 'RPT-2025-002',
    claimId: 'CLM-2025-002',
    brandId: 'Nestlé India',
    recyclerId: 'GreenLoop Bengaluru',
    score: 67,
    status: 'final',
    issuesCount: 3,
    generatedAt: '2025-09-24T00:00:00Z',
    reportHash: '0x7a2b4c6d8e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1c3e5f7a9b1c3e5'
  },
  {
    id: 'RPT-2025-003',
    claimId: 'CLM-2025-003',
    brandId: 'PepsiCo India',
    recyclerId: 'Rx-204 Delhi',
    score: 42,
    status: 'draft',
    issuesCount: 8,
    generatedAt: '2025-09-23T00:00:00Z'
  }
];

const Reports: React.FC = () => {
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: '',
    status: '',
    dateRange: null as any
  });

  useEffect(() => {
    // Simulate loading reports
    setTimeout(() => {
      setReports(mockReports);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'success';
      case 'final': return 'processing';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#52c41a';
    if (score >= 50) return '#faad14';
    return '#ff4d4f';
  };

  const handleDownload = (reportId: string) => {
    message.success(`Downloading report ${reportId}...`);
  };

  const handleShare = (reportId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/app/claimclean/reports/${reportId}`);
    message.success('Report link copied to clipboard');
  };

  const handleSubmitToCPCB = (reportId: string) => {
    message.success(`Report ${reportId} submitted to CPCB/SPCB`);
    // Update report status
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'submitted' as const, submittedToCPCB: new Date().toISOString() }
        : report
    ));
  };

  const columns = [
    {
      title: 'Report ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code>{id}</Text>
      ),
    },
    {
      title: 'Claim ID',
      dataIndex: 'claimId',
      key: 'claimId',
      render: (claimId: string) => (
        <Button type="link" className={styles.claimLink}>
          {claimId}
        </Button>
      ),
    },
    {
      title: 'Brand',
      dataIndex: 'brandId',
      key: 'brandId',
    },
    {
      title: 'Recycler',
      dataIndex: 'recyclerId',
      key: 'recyclerId',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Space>
          <Text style={{ color: getScoreColor(score), fontWeight: 'bold' }}>
            {score}
          </Text>
          <Progress 
            percent={score} 
            size="small" 
            showInfo={false}
            strokeColor={getScoreColor(score)}
            className={styles.scoreProgress}
          />
        </Space>
      ),
    },
    {
      title: 'Issues',
      dataIndex: 'issuesCount',
      key: 'issuesCount',
      render: (count: number) => (
        <Badge 
          count={count} 
          showZero 
          color={count > 5 ? '#ff4d4f' : count > 2 ? '#faad14' : '#52c41a'}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Generated',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Hash',
      dataIndex: 'reportHash',
      key: 'reportHash',
      render: (hash?: string) => hash ? (
        <Tooltip title={hash}>
          <Text code className={styles.hashText}>
            {hash.substring(0, 8)}...{hash.substring(hash.length - 4)}
          </Text>
        </Tooltip>
      ) : (
        <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: VerificationReport) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => message.info('View report - Feature coming soon')}
          >
            View
          </Button>
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id)}
          >
            Download
          </Button>
          <Button 
            size="small" 
            icon={<ShareAltOutlined />}
            onClick={() => handleShare(record.id)}
          >
            Share
          </Button>
          {record.status === 'final' && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => handleSubmitToCPCB(record.id)}
              className={styles.submitButton}
            >
              Submit to CPCB
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Calculate stats
  const stats = {
    total: reports.length,
    submitted: reports.filter(r => r.status === 'submitted').length,
    avgScore: reports.length > 0 ? Math.round(reports.reduce((acc, r) => acc + r.score, 0) / reports.length) : 0,
    totalIssues: reports.reduce((acc, r) => acc + r.issuesCount, 0)
  };

  const filteredReports = reports.filter(report => {
    const matchesBrand = !filters.brand || report.brandId.toLowerCase().includes(filters.brand.toLowerCase());
    const matchesStatus = !filters.status || report.status === filters.status;
    // Add date range filtering logic here if needed
    return matchesBrand && matchesStatus;
  });

  return (
    <div className="reports-page">
      {/* Header */}
      <div className={styles.header}>
        <Title level={2} className={styles.headerTitle}>
          <BarChartOutlined className={styles.headerIcon} />
          Verification Reports
        </Title>
        <Text type="secondary">
          EPR compliance reports ready for submission to CPCB/SPCB
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Reports"
              value={stats.total}
              prefix={<FileTextOutlined className={styles.statIconGreen} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Submitted to CPCB"
              value={stats.submitted}
              prefix={<CheckCircleOutlined className={styles.statIconSuccess} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={stats.avgScore}
              suffix="/100"
              prefix={<TrophyOutlined style={{ color: getScoreColor(stats.avgScore) }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Issues"
              value={stats.totalIssues}
              prefix={<ExclamationCircleOutlined className={styles.statIconWarning} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Search by brand..."
              prefix={<SearchOutlined />}
              value={filters.brand}
              onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              allowClear
            >
              <Option value="draft">Draft</Option>
              <Option value="final">Final</Option>
              <Option value="submitted">Submitted</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <RangePicker 
              style={{ width: '100%' }}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Space>
              <Button icon={<FilterOutlined />}>
                More Filters
              </Button>
              <Button 
                type="primary"
                icon={<DownloadOutlined />}
                className={styles.exportButton}
                onClick={() => message.success('Exporting all reports...')}
              >
                Export All
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Reports Table */}
      <Card>
        <Table
          dataSource={filteredReports}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reports`
          }}
        />
      </Card>

      {/* Help Section */}
      <Card 
        title="CPCB/SPCB Submission Guidelines" 
        className={styles.helpCard}
        type="inner"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            <CheckCircleOutlined className={styles.guidelineSuccess} />
            Reports with verification score ≥75 are automatically approved for submission
          </Text>
          <Text>
            <ExclamationCircleOutlined className={styles.guidelineWarning} />
            Reports with scores between 50-74 require manual review before submission
          </Text>
          <Text>
            <LinkOutlined className={styles.guidelineLink} />
            Each report includes an immutable hash for blockchain verification
          </Text>
          <Text type="secondary">
            For questions about submission requirements, contact your compliance officer or visit the CPCB portal.
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default Reports;