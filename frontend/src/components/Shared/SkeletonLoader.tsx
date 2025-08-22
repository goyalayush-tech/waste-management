import React from 'react';
import { Skeleton, Card, Row, Col } from 'antd';

export interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'table' | 'form' | 'dashboard' | 'custom';
  rows?: number;
  loading?: boolean;
  children?: React.ReactNode;
  avatar?: boolean;
  title?: boolean;
  paragraph?: boolean | { rows?: number; width?: string | number | Array<string | number> };
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'custom',
  rows = 3,
  loading = true,
  children,
  avatar = false,
  title = true,
  paragraph = true,
}) => {
  if (!loading && children) {
    return <>{children}</>;
  }

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Card>
            <Skeleton
              avatar={avatar}
              title={title}
              paragraph={paragraph}
              active
            />
          </Card>
        );

      case 'list':
        return (
          <div>
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #f0f0f0' }}>
                <Skeleton
                  avatar={{ size: 'small' }}
                  title={{ width: '60%' }}
                  paragraph={{ rows: 2, width: ['100%', '80%'] }}
                  active
                />
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div>
            <Skeleton.Input style={{ width: '100%', marginBottom: '16px' }} active />
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <Skeleton
                  title={false}
                  paragraph={{ rows: 1, width: '100%' }}
                  active
                />
              </div>
            ))}
          </div>
        );

      case 'form':
        return (
          <div>
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} style={{ marginBottom: '24px' }}>
                <Skeleton.Input style={{ width: '150px', marginBottom: '8px' }} active />
                <Skeleton.Input style={{ width: '100%' }} active />
              </div>
            ))}
          </div>
        );

      case 'dashboard':
        return (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Col key={index} span={6}>
                  <Card>
                    <Skeleton
                      title={{ width: '80%' }}
                      paragraph={{ rows: 1, width: '60%' }}
                      active
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            <Row gutter={[16, 16]}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Col key={index} span={8}>
                  <Card>
                    <Skeleton
                      title={{ width: '70%' }}
                      paragraph={{ rows: 3, width: ['100%', '90%', '80%'] }}
                      active
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );

      default:
        return (
          <Skeleton
            avatar={avatar}
            title={title}
            paragraph={paragraph}
            active
          />
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;