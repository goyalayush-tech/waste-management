import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Typography } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;

const SimpleLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px' }}>
        <Title level={3} style={{ color: 'white', margin: 0, lineHeight: '64px' }}>
          🌱 Waste Management System
        </Title>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default SimpleLayout;