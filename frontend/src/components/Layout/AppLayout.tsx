import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Typography,
  Breadcrumb,
  Drawer,
  theme,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  BlockOutlined,
  LineChartOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  SearchOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import SearchBar from '../Search/SearchBar';
import NotificationCenter from '../Notifications/NotificationCenter';
import ConnectionStatus from '../Status/ConnectionStatus';
import { HelpWidget } from '../Help';
import InstallPrompt from '../PWA/InstallPrompt';
import { RootState } from '../../store/store';
import { toggleSidebar, setMobileMenuOpen } from '../../store/slices/navigationSlice';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// Navigation menu items (original paths)
const menuItems: MenuProps['items'] = [
  { key: '/', icon: <HomeOutlined />, label: 'Home' },
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/waste-analysis', icon: <ExperimentOutlined />, label: 'Waste Analysis' },
  { key: '/contamination-detection', icon: <SafetyCertificateOutlined />, label: 'Contamination Detection' },
  {
    key: '/blockchain',
    icon: <BlockOutlined />,
    label: 'Blockchain',
    children: [
      { key: '/blockchain/certificates', label: 'NFT Certificates' },
      { key: '/blockchain/digital-twins', label: 'Digital Twins' },
    ],
  },
  { key: '/analytics', icon: <LineChartOutlined />, label: 'Analytics' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

// User dropdown menu
const userMenuItems: MenuProps['items'] = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Profile',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
  {
    type: 'divider',
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Logout',
    danger: true,
  },
];

// Breadcrumb mapping (original)
const breadcrumbNameMap: Record<string, string> = {
  '/': 'Home',
  '/landing': 'Welcome',
  '/dashboard': 'Dashboard',
  '/waste-analysis': 'Waste Analysis',
  '/contamination-detection': 'Contamination Detection',
  '/blockchain': 'Blockchain',
  '/blockchain/certificates': 'NFT Certificates',
  '/blockchain/digital-twins': 'Digital Twins',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

const AppLayout: React.FC = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const { sidebarCollapsed, mobileMenuOpen } = useSelector((state: RootState) => state.navigation);
  const { token } = theme.useToken();

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992 && mobileMenuOpen) {
        dispatch(setMobileMenuOpen(false));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen, dispatch]);

  // Generate breadcrumb items
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = [
    {
      title: (
  <span onClick={() => navigate('/') } className="breadcrumb-link">
          <HomeOutlined /> Home
        </span>
      ),
    },
    ...pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const isLast = index === pathSnippets.length - 1;
      return {
        title: isLast ? (
          breadcrumbNameMap[url] || snippet
        ) : (
          <span onClick={() => navigate(url)} className="breadcrumb-link">
            {breadcrumbNameMap[url] || snippet}
          </span>
        ),
      };
    }),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    dispatch(setMobileMenuOpen(false));
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        // Handle logout logic
        console.log('Logout clicked');
        break;
    }
  };

  const sidebarContent = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ height: '100%', borderRight: 0 }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          // Hide sidebar on mobile
        }}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
        className="desktop-sidebar"
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #303030',
          }}
        >
          <Text
            style={{
              color: '#00b96b',
              fontWeight: 'bold',
              fontSize: sidebarCollapsed ? '16px' : '18px',
            }}
          >
            {sidebarCollapsed ? '🌱' : '🌱 WMS'}
          </Text>
        </div>
        {sidebarContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title="🌱 Waste Management System"
        placement="left"
        onClose={() => dispatch(setMobileMenuOpen(false))}
        open={mobileMenuOpen}
        bodyStyle={{ padding: 0 }}
        className="mobile-drawer"
      >
        {sidebarContent}
      </Drawer>

      <Layout style={{ marginLeft: sidebarCollapsed ? 0 : 200 }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 16px',
            background: '#001529',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Mobile menu button */}
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => dispatch(setMobileMenuOpen(true))}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                color: 'white',
                display: 'none',
              }}
              className="mobile-menu-button"
            />

            {/* Desktop collapse button */}
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => dispatch(toggleSidebar())}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                color: 'white',
              }}
              className="desktop-collapse-button"
            />

            {/* Search Bar */}
            <SearchBar />
          </div>

          <Space size="middle">
            {/* Connection Status */}
            <div data-tour="connection-status">
              <ConnectionStatus />
            </div>

            {/* Notifications */}
            <div data-tour="notifications">
              <Badge count={5} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => setNotificationOpen(true)}
                  style={{ color: 'white' }}
                />
              </Badge>
            </div>

            {/* User Menu */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer', color: 'white' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text style={{ color: 'white' }}>Admin User</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Breadcrumb */}
        <div
          style={{
            padding: '16px 24px 0',
            background: '#f0f2f5',
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Main Content */}
        <Content
          style={{
            margin: '16px 24px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      {/* Notification Center */}
      <NotificationCenter
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />

      {/* Help Widget */}
      <HelpWidget context={location.pathname.split('/')[1] || 'general'} />

      {/* PWA Install Prompt */}
      <InstallPrompt
        onInstall={() => {
          console.log('PWA installed successfully');
        }}
        onDismiss={() => {
          console.log('PWA install prompt dismissed');
        }}
      />
    </Layout>
  );
};

export default AppLayout;