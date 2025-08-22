import React from 'react';
import { Table as AntTable, TableProps as AntTableProps, Empty, Spin } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';

export interface SharedTableProps<T = any> extends AntTableProps<T> {
  variant?: 'default' | 'bordered' | 'striped';
  emptyText?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  loadingText?: string;
}

const Table = <T extends Record<string, any>>({
  variant = 'default',
  emptyText = 'No data available',
  emptyDescription = 'There are no records to display',
  isLoading = false,
  loadingText = 'Loading data...',
  dataSource,
  className,
  ...props
}: SharedTableProps<T>) => {
  const getTableClassName = () => {
    let classes = 'shared-table';
    
    switch (variant) {
      case 'bordered':
        classes += ' bordered';
        break;
      case 'striped':
        classes += ' striped';
        break;
    }
    
    if (className) {
      classes += ` ${className}`;
    }
    
    return classes;
  };

  const customEmpty = (
    <Empty
      image={<DatabaseOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
      description={
        <div>
          <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
            {emptyText}
          </div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
            {emptyDescription}
          </div>
        </div>
      }
    />
  );

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '200px',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div style={{ color: '#8c8c8c' }}>{loadingText}</div>
      </div>
    );
  }

  return (
    <AntTable<T>
      dataSource={dataSource}
      className={getTableClassName()}
      locale={{ emptyText: customEmpty }}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} of ${total} items`,
        ...props.pagination,
      }}
      {...props}
    />
  );
};

export default Table;