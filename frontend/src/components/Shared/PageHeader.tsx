import React from 'react';
import { Typography, Space, Breadcrumb, Divider, Row, Col, Tag } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export interface BreadcrumbItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
  tags?: Array<{
    text: string;
    color?: string;
    icon?: React.ReactNode;
  }>;
  showDivider?: boolean;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  breadcrumbs = [],
  extra,
  tags = [],
  showDivider = true,
  className = '',
}) => {
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/', icon: <HomeOutlined /> },
    ...breadcrumbs,
  ];

  return (
    <div className={`page-header ${className}`}>
      {/* Breadcrumbs */}
      {defaultBreadcrumbs.length > 1 && (
        <Breadcrumb style={{ marginBottom: '16px' }}>
          {defaultBreadcrumbs.map((item, index) => (
            <Breadcrumb.Item key={index} href={item.href}>
              {item.icon && <span style={{ marginRight: '4px' }}>{item.icon}</span>}
              {item.title}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}

      {/* Main header content */}
      <Row justify="space-between" align="top" gutter={[16, 16]}>
        <Col flex="auto">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {/* Title and subtitle */}
            <div>
              <Title level={2} style={{ margin: 0 }}>
                {title}
                {subtitle && (
                  <Text type="secondary" style={{ marginLeft: '12px', fontSize: '16px', fontWeight: 400 }}>
                    {subtitle}
                  </Text>
                )}
              </Title>
            </div>

            {/* Description */}
            {description && (
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {description}
              </Text>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <Space size="small" wrap>
                {tags.map((tag, index) => (
                  <Tag key={index} color={tag.color} icon={tag.icon}>
                    {tag.text}
                  </Tag>
                ))}
              </Space>
            )}
          </Space>
        </Col>

        {/* Extra actions */}
        {extra && (
          <Col flex="none">
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {extra}
            </div>
          </Col>
        )}
      </Row>

      {/* Divider */}
      {showDivider && (
        <Divider style={{ margin: '16px 0 24px 0' }} />
      )}
    </div>
  );
};

export default PageHeader;