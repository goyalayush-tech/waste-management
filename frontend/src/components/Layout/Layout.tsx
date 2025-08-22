import React from 'react';
import { Layout as AntLayout, Typography } from 'antd';

const { Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div>
      {(title || subtitle) && (
        <div style={{ marginBottom: '24px' }}>
          {title && <Title level={2}>{title}</Title>}
          {subtitle && (
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Layout;