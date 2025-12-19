import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Typography, Space, Button, Alert } from 'antd';
import { UserOutlined, TeamOutlined, FileTextOutlined, DollarOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalClients: number;
  activeClients: number;
  totalDocuments: number;
  pendingAudits: number;
  completedAudits: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemHealth: string;
  lastBackup: string;
}

interface ActivityItem {
  id: string;
  type: string;
  user: string;
  timestamp: string;
}

interface AlertItem {
  id: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/overview');
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
        setRecentActivity(data.data.recentActivity);
        setAlerts(data.data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login': return <UserOutlined />;
      case 'document_upload': return <FileTextOutlined />;
      case 'audit_completed': return <CheckCircleOutlined />;
      default: return <UserOutlined />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'blue';
    }
  };

  if (loading) {
    return <div>Loading admin dashboard...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Admin Dashboard</Title>
      
      {/* Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Clients"
              value={stats?.activeClients || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Documents"
              value={stats?.totalDocuments || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Monthly Revenue"
              value={stats?.monthlyRevenue || 0}
              prefix={<DollarOutlined />}
              suffix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* System Health */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="System Health" extra={<Tag color={stats?.systemHealth === 'healthy' ? 'green' : 'red'}>{stats?.systemHealth}</Tag>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Last Backup: {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleString() : 'N/A'}</Text>
              <Text>Pending Audits: {stats?.pendingAudits || 0}</Text>
              <Text>Completed Audits: {stats?.completedAudits || 0}</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Revenue Overview">
            <Statistic
              title="Total Revenue"
              value={stats?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              suffix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activity and Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" extra={<Button size="small">View All</Button>}>
            <List
              size="small"
              dataSource={recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getActivityIcon(item.type)}
                    title={item.type.replace('_', ' ').toUpperCase()}
                    description={`${item.user} - ${new Date(item.timestamp).toLocaleString()}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="System Alerts" extra={<Button size="small">View All</Button>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  message={alert.message}
                  type={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                  showIcon
                  description={new Date(alert.timestamp).toLocaleString()}
                  style={{ marginBottom: '8px' }}
                />
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard; 