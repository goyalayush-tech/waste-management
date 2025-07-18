import React from 'react';
import { Layout as AntLayout, Menu, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  TeamOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  RobotOutlined,
  ApartmentOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/waste-analysis',
      icon: <ExperimentOutlined />,
      label: 'Waste Analysis',
    },
    {
      key: '/contamination-detection',
      icon: <SafetyCertificateOutlined />,
      label: 'Contamination Detection',
    },
    {
      key: '/nft-certificates',
      icon: <SafetyCertificateOutlined />,
      label: 'NFT Certificates',
    },
    {
      key: '/defi-marketplace',
      icon: <DollarOutlined />,
      label: 'DeFi Marketplace',
    },
    {
      key: '/dao',
      icon: <TeamOutlined />,
      label: 'DAO Governance',
    },
    {
      key: '/metaverse',
      icon: <GlobalOutlined />,
      label: 'Metaverse',
    },
    {
      key: '/quantum-analytics',
      icon: <ThunderboltOutlined />,
      label: 'Quantum Analytics',
    },
    {
      key: '/cross-chain',
      icon: <LinkOutlined />,
      label: 'Cross-Chain',
    },
    {
      key: '/autonomous-processing',
      icon: <RobotOutlined />,
      label: 'Autonomous Processing',
    },
    {
      key: '/digital-twins',
      icon: <ApartmentOutlined />,
      label: 'Digital Twins',
    },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        theme="dark"
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={4} style={{ color: '#00b96b', margin: 0 }}>
            Waste Management
          </Title>
          <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
            Advanced AI System
          </div>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <AntLayout style={{ marginLeft: 250 }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#1f1f1f',
            borderBottom: '1px solid #303030',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Title level={3} style={{ margin: 0, color: '#d9d9d9' }}>
            Advanced Waste Management System
          </Title>
          
          <div style={{ color: '#8c8c8c' }}>
            AI-Powered • Blockchain • Quantum Enhanced
          </div>
        </Header>
        
        <Content
          style={{
            margin: 0,
            padding: 0,
            background: '#141414',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;