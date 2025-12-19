import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Button, 
  Table, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  message,
  Space,
  Divider,
  Badge,
  Avatar
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { AuditTask } from '../types';
import styles from './FieldAudits.module.css';

const { Title, Text } = Typography;
const { Option } = Select;

// Mock field audit data
const mockFieldAudits: AuditTask[] = [
  {
    _id: 'FA-001',
    claimId: 'CLM-2025-001',
    type: 'field',
    status: 'running',
    assignedTo: 'Raj Kumar',
    createdAt: '2025-09-24T00:00:00Z',
    updatedAt: '2025-09-26T00:00:00Z'
  },
  {
    _id: 'FA-002',
    claimId: 'CLM-2025-003',
    type: 'field',
    status: 'queued',
    assignedTo: 'Priya Sharma',
    createdAt: '2025-09-25T00:00:00Z',
    updatedAt: '2025-09-25T00:00:00Z'
  },
  {
    _id: 'FA-003',
    claimId: 'CLM-2025-005',
    type: 'field',
    status: 'complete',
    assignedTo: 'Amit Singh',
    result: {
      score: 78,
      issues: [
        { code: 'MINOR_DISCREPANCY', severity: 'low' as const, message: 'Minor weight variance detected' }
      ]
    },
    createdAt: '2025-09-20T00:00:00Z',
    updatedAt: '2025-09-23T00:00:00Z'
  }
];

const mockFieldPartners = [
  { id: 'fp-001', name: 'Raj Kumar', location: 'Mumbai', active: true },
  { id: 'fp-002', name: 'Priya Sharma', location: 'Delhi', active: true },
  { id: 'fp-003', name: 'Amit Singh', location: 'Bengaluru', active: true },
  { id: 'fp-004', name: 'Kavya Reddy', location: 'Hyderabad', active: true }
];

const FieldAudits: React.FC = () => {
  const [fieldAudits, setFieldAudits] = useState<AuditTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // Simulate loading field audits
    setTimeout(() => {
      setFieldAudits(mockFieldAudits);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return '#52c41a';
      case 'running': return '#faad14';
      case 'queued': return '#1677ff';
      case 'failed': return '#ff4d4f';
      default: return '#8c8c8c';
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

  const handleAssignAudit = async (_values: any) => {
    try {
      // Simulate API call to assign field audit
      message.success('Field audit assigned successfully');
      setAssignModalOpen(false);
      form.resetFields();
      // Reload field audits
    } catch (error) {
      message.error('Failed to assign field audit');
    }
  };

  const columns = [
    {
      title: 'Audit ID',
      dataIndex: '_id',
      key: '_id',
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag 
          color={getStatusColor(status)}
          icon={getStatusIcon(status)}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Assigned Partner',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (partner: string) => partner ? (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{partner}</Text>
        </Space>
      ) : (
        <Text type="secondary">Unassigned</Text>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: AuditTask) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => message.info('View audit details - Feature coming soon')}
          >
            View
          </Button>
          {record.status === 'queued' && (
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedClaim(record.claimId);
                setAssignModalOpen(true);
              }}
            >
              Assign
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Stats calculation
  const stats = {
    total: fieldAudits.length,
    queued: fieldAudits.filter(a => a.status === 'queued').length,
    running: fieldAudits.filter(a => a.status === 'running').length,
    completed: fieldAudits.filter(a => a.status === 'complete').length
  };

  return (
    <div className={styles.fieldAuditsPage}>
      {/* Header */}
      <div className={styles.header}>
        <Title level={2} className={styles.headerTitle}>
          <TeamOutlined className={styles.headerIcon} />
          Field Audits
        </Title>
        <Text type="secondary">
          Manage and oversee on-ground verification audits
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={6}>
          <Card>
            <div className={styles.statCard}>
              <Badge count={stats.total} showZero color="#1677ff">
                <Avatar shape="square" size="large" icon={<FileTextOutlined />} />
              </Badge>
              <div className={styles.statBadge}>
                <Text type="secondary">Total Audits</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div className={styles.statCard}>
              <Badge count={stats.queued} showZero color="#faad14">
                <Avatar shape="square" size="large" icon={<ClockCircleOutlined />} />
              </Badge>
              <div className={styles.statBadge}>
                <Text type="secondary">Queued</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div className={styles.statCard}>
              <Badge count={stats.running} showZero color="#1677ff">
                <Avatar shape="square" size="large" icon={<ClockCircleOutlined />} />
              </Badge>
              <div className={styles.statBadge}>
                <Text type="secondary">In Progress</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div className={styles.statCard}>
              <Badge count={stats.completed} showZero color="#52c41a">
                <Avatar shape="square" size="large" icon={<CheckCircleOutlined />} />
              </Badge>
              <div className={styles.statBadge}>
                <Text type="secondary">Completed</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card 
        title="Field Audit Tasks"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setAssignModalOpen(true)}
            className={styles.newAssignmentButton}
          >
            New Assignment
          </Button>
        }
      >
        <Table
          dataSource={fieldAudits}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Assignment Modal */}
      <Modal
        title="Assign Field Audit"
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setSelectedClaim(null);
          form.resetFields();
        }}
        footer={null}
        className={styles.assignModal}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAssignAudit}
          initialValues={{
            claimId: selectedClaim,
            dueDate: null,
            priority: 'medium'
          }}
        >
          <Form.Item
            label="Claim ID"
            name="claimId"
            rules={[{ required: true, message: 'Please enter claim ID' }]}
            className={styles.formItem}
          >
            <Input 
              placeholder="CLM-2025-001"
              prefix={<FileTextOutlined className={styles.inputPrefix} />}
            />
          </Form.Item>

          <Form.Item
            label="Assign to Field Partner"
            name="assignedTo"
            rules={[{ required: true, message: 'Please select a field partner' }]}
            className={styles.formItem}
          >
            <Select placeholder="Select field partner">
              {mockFieldPartners.map(partner => (
                <Option key={partner.id} value={partner.name}>
                  <Space className={styles.selectOption}>
                    <Avatar size="small" icon={<UserOutlined />} className={styles.optionAvatar} />
                    <span>{partner.name}</span>
                    <Tag className={styles.optionTag}>
                      <EnvironmentOutlined className={styles.partnerTag} />
                      {partner.location}
                    </Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Due Date"
            name="dueDate"
            className={styles.formItem}
          >
            <DatePicker 
              className={styles.datePicker}
              placeholder="Select due date"
              prefix={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
            className={styles.formItem}
          >
            <Select>
              <Option value="high">
                <Tag color="red">High Priority</Tag>
              </Option>
              <Option value="medium">
                <Tag color="orange">Medium Priority</Tag>
              </Option>
              <Option value="low">
                <Tag color="green">Low Priority</Tag>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Instructions"
            name="instructions"
            className={styles.formItem}
          >
            <Input.TextArea 
              rows={3}
              placeholder="Special instructions for the field partner..."
              className={styles.textArea}
            />
          </Form.Item>

          <Divider className={styles.formDivider} />

          <Form.Item className={styles.formActions}>
            <Space>
              <Button onClick={() => setAssignModalOpen(false)} className={styles.cancelButton}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                className={styles.assignButton}
              >
                Assign Audit
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FieldAudits;