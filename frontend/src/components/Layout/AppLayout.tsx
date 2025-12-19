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
  SafetyCertificateOutlined,
  LineChartOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  SearchOutlined,
  WifiOutlined,
  AuditOutlined,
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

// Navigation menu items (ClaimClean only)
const menuItems: MenuProps['items'] = [
  { key: '/app/claimclean/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  {
    key: '/app/claimclean/claims',
    icon: <AuditOutlined />,
    label: 'Claims Management',
    children: [
      { key: '/app/claimclean/claims', label: 'All Claims' },
      { key: '/app/claimclean/claims/new', label: 'New Claim' },
    ],
  },
  {
    key: '/app/claimclean/audits',
    icon: <SafetyCertificateOutlined />,
    label: 'Audits',
    children: [
      { key: '/app/claimclean/audits/console', label: 'AI Audit Queue' },
      { key: '/app/claimclean/audits/field', label: 'Field Audits' },
    ],
  },
  { key: '/app/claimclean/reports', icon: <LineChartOutlined />, label: 'Reports' },
  { key: '/app/claimclean/admin', icon: <SettingOutlined />, label: 'Administration' },
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

// Breadcrumb mapping (ClaimClean paths)
const breadcrumbNameMap: Record<string, string> = {
  '/': 'Home',
  '/app': 'ClaimClean',
  '/app/claimclean': 'ClaimClean',
  '/app/claimclean/dashboard': 'Dashboard',
  '/app/claimclean/claims': 'Claims Management',
  '/app/claimclean/claims/new': 'New Claim',
  '/app/claimclean/audits': 'Audits',
  '/app/claimclean/audits/console': 'AI Audit Queue',
  '/app/claimclean/audits/field': 'Field Audits',
  '/app/claimclean/reports': 'Reports',
  '/app/claimclean/admin': 'Administration',
  '/app/search': 'Search',
  '/app/search/advanced': 'Advanced Search',
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
  <span onClick={() => navigate('/app/claimclean/dashboard') } className="breadcrumb-link">
          <HomeOutlined /> ClaimClean
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
        navigate('/app/settings');
        break;
      case 'settings':
        navigate('/app/settings');
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
      style={{
        height: '100%',
        borderRight: 0,
        background: 'transparent'
      }}
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
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        }}
        className="desktop-sidebar"
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: sidebarCollapsed ? '16px' : '18px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {sidebarCollapsed ? '🌱' : '🌱 ClaimClean'}
          </Text>
        </div>
        {sidebarContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title="🌱 ClaimClean System"
        placement="left"
        onClose={() => dispatch(setMobileMenuOpen(false))}
        open={mobileMenuOpen}
        styles={{
          body: {
            padding: 0,
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
          },
          header: {
            background: 'rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            color: 'white'
          }
        }}
        className="mobile-drawer"
      >
        {sidebarContent}
      </Drawer>

      <Layout style={{ marginLeft: sidebarCollapsed ? 0 : 200 }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 16px',
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
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