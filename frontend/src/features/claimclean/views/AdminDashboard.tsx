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
  Switch,
  Modal,
  Form,
  Select,
  InputNumber,
  Divider,
  message,
  Statistic,
  Progress,
  Tabs
} from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  SecurityScanOutlined,
  ApiOutlined,
  DollarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Mock data for admin features
const mockUsers = [
  {
    id: 'user-001',
    name: 'Raj Patel',
    email: 'raj.patel@hulunilever.com',
    role: 'Brand Manager',
    organization: 'HUL India',
    status: 'active',
    lastLogin: '2025-09-26T08:30:00Z'
  },
  {
    id: 'user-002', 
    name: 'Priya Singh',
    email: 'priya.singh@nestle.com',
    role: 'Compliance Officer',
    organization: 'Nestlé India',
    status: 'active',
    lastLogin: '2025-09-25T14:20:00Z'
  }
];

const mockScoringPolicies = [
  {
    code: 'SHA_MISMATCH',
    description: 'Document hash mismatch detected',
    penalty: 15,
    severity: 'high' as const,
    enabled: true
  },
  {
    code: 'DUP_SHA',
    description: 'Duplicate document hash found',
    penalty: 20,
    severity: 'high' as const,
    enabled: true
  },
  {
    code: 'TIMESTAMP_OUTSIDE_PERIOD',
    description: 'Document timestamp outside claim period',
    penalty: 10,
    severity: 'med' as const,
    enabled: true
  },
  {
    code: 'GPS_MISMATCH',
    description: 'GPS location mismatch with facility',
    penalty: 12,
    severity: 'med' as const,
    enabled: true
  },
  {
    code: 'LICENSE_EXPIRED',
    description: 'Recycler license has expired',
    penalty: 25,
    severity: 'high' as const,
    enabled: true
  }
];

const mockIntegrations = [
  {
    name: 'AWS S3',
    type: 'storage',
    status: 'connected',
    lastSync: '2025-09-26T10:15:00Z'
  },
  {
    name: 'Google Cloud Vision',
    type: 'ocr',
    status: 'connected',
    lastSync: '2025-09-26T09:45:00Z'
  },
  {
    name: 'MapBox',
    type: 'maps',
    status: 'connected',
    lastSync: '2025-09-26T08:30:00Z'
  }
];

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState(mockUsers);
  const [scoringPolicies, setScoringPolicies] = useState(mockScoringPolicies);
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [form] = Form.useForm();

  const handleUserStatusChange = (userId: string, status: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status } : user
    ));
    message.success(`User ${status === 'active' ? 'activated' : 'deactivated'}`);
  };

  const handlePolicyToggle = (code: string, enabled: boolean) => {
    setScoringPolicies(prev => prev.map(policy => 
      policy.code === code ? { ...policy, enabled } : policy
    ));
    message.success(`Policy ${code} ${enabled ? 'enabled' : 'disabled'}`);
  };

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag>{role}</Tag>,
    },
    {
      title: 'Organization',
      dataIndex: 'organization',
      key: 'organization',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Switch
          checked={status === 'active'}
          onChange={(checked) => handleUserStatusChange(record.id, checked ? 'active' : 'inactive')}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setUserModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => message.info('Delete user - Feature coming soon')}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const policyColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Text code>{code}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Penalty',
      dataIndex: 'penalty',
      key: 'penalty',
      render: (penalty: number) => <Text strong>-{penalty} pts</Text>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colors = { high: 'red', med: 'orange', low: 'green' };
        return <Tag color={colors[severity as keyof typeof colors]}>{severity.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: any) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handlePolicyToggle(record.code, checked)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Button 
          size="small" 
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedPolicy(record);
            setPolicyModalOpen(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  const integrationColumns = [
    {
      title: 'Service',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type.toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'connected' ? 'green' : 'red'}>
          {status === 'connected' ? 'Connected' : 'Disconnected'}
        </Tag>
      ),
    },
    {
      title: 'Last Sync',
      dataIndex: 'lastSync',
      key: 'lastSync',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button size="small">Configure</Button>
          <Button size="small">Test</Button>
        </Space>
      ),
    },
  ];

  // Calculate system stats
  const systemStats = {
    activeUsers: users.filter(u => u.status === 'active').length,
    totalUsers: users.length,
    activePolicies: scoringPolicies.filter(p => p.enabled).length,
    totalPolicies: scoringPolicies.length,
    connectedIntegrations: integrations.filter(i => i.status === 'connected').length,
    totalIntegrations: integrations.length
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1B5E20' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          ClaimClean Admin
        </Title>
        <Text type="secondary">
          System administration and configuration
        </Text>
      </div>

      {/* System Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Users"
              value={systemStats.activeUsers}
              suffix={`/ ${systemStats.totalUsers}`}
              prefix={<UserOutlined style={{ color: '#1B5E20' }} />}
            />
            <Progress 
              percent={(systemStats.activeUsers / systemStats.totalUsers) * 100} 
              size="small" 
              showInfo={false}
              strokeColor="#1B5E20"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Policies"
              value={systemStats.activePolicies}
              suffix={`/ ${systemStats.totalPolicies}`}
              prefix={<SecurityScanOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress 
              percent={(systemStats.activePolicies / systemStats.totalPolicies) * 100} 
              size="small" 
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Connected Services"
              value={systemStats.connectedIntegrations}
              suffix={`/ ${systemStats.totalIntegrations}`}
              prefix={<ApiOutlined style={{ color: '#1677ff' }} />}
            />
            <Progress 
              percent={(systemStats.connectedIntegrations / systemStats.totalIntegrations) * 100} 
              size="small" 
              showInfo={false}
              strokeColor="#1677ff"
            />
          </Card>
        </Col>
      </Row>

      {/* Admin Tabs */}
      <Card>
        <Tabs defaultActiveKey="users">
          <TabPane tab={
            <span>
              <UserOutlined />
              Users & Roles
            </span>
          } key="users">
            <div style={{ marginBottom: '16px' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setUserModalOpen(true)}
                style={{ backgroundColor: '#1B5E20', borderColor: '#1B5E20' }}
              >
                Add User
              </Button>
            </div>
            <Table
              dataSource={users}
              columns={userColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={
            <span>
              <SecurityScanOutlined />
              Scoring Policies
            </span>
          } key="policies">
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setPolicyModalOpen(true)}
                  style={{ backgroundColor: '#1B5E20', borderColor: '#1B5E20' }}
                >
                  Add Policy
                </Button>
                <Button>Import Policies</Button>
                <Button>Export Configuration</Button>
              </Space>
            </div>
            <Table
              dataSource={scoringPolicies}
              columns={policyColumns}
              rowKey="code"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={
            <span>
              <ApiOutlined />
              Integrations
            </span>
          } key="integrations">
            <Table
              dataSource={integrations}
              columns={integrationColumns}
              rowKey="name"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={
            <span>
              <DollarOutlined />
              Billing & Plan
            </span>
          } key="billing">
            <Card>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Current Plan"
                    value="Enterprise"
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Claims This Month"
                    value="247"
                    suffix="/ 1000"
                  />
                </Col>
              </Row>
              <Divider />
              <Text type="secondary">
                Plan renewal: December 31, 2025
              </Text>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* User Modal */}
      <Modal
        title={selectedUser ? "Edit User" : "Add User"}
        open={userModalOpen}
        onCancel={() => {
          setUserModalOpen(false);
          setSelectedUser(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            message.success('User saved successfully');
            setUserModalOpen(false);
            form.resetFields();
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select>
                  <Option value="Brand Manager">Brand Manager</Option>
                  <Option value="Compliance Officer">Compliance Officer</Option>
                  <Option value="Auditor">Auditor</Option>
                  <Option value="Field Partner">Field Partner</Option>
                  <Option value="Admin">Admin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Organization"
                name="organization"
                rules={[{ required: true, message: 'Please enter organization' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setUserModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{ backgroundColor: '#1B5E20', borderColor: '#1B5E20' }}
              >
                {selectedUser ? 'Update' : 'Create'} User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Policy Modal */}
      <Modal
        title={selectedPolicy ? "Edit Policy" : "Add Policy"}
        open={policyModalOpen}
        onCancel={() => {
          setPolicyModalOpen(false);
          setSelectedPolicy(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            message.success('Policy saved successfully');
            setPolicyModalOpen(false);
            form.resetFields();
          }}
        >
          <Form.Item
            label="Code"
            name="code"
            rules={[{ required: true, message: 'Please enter policy code' }]}
          >
            <Input placeholder="POLICY_CODE" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Penalty (points)"
                name="penalty"
                rules={[{ required: true, message: 'Please enter penalty' }]}
              >
                <InputNumber min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Severity"
                name="severity"
                rules={[{ required: true, message: 'Please select severity' }]}
              >
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="med">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPolicyModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{ backgroundColor: '#1B5E20', borderColor: '#1B5E20' }}
              >
                {selectedPolicy ? 'Update' : 'Create'} Policy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;