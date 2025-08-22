import React, { useEffect, useState } from 'react';
import { eprClient } from '@/services/api';
import { Table, Typography, Tag } from 'antd';

const { Title } = Typography;

const ClientsPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      const client = eprClient();
      const res = await client.getClients({ limit: 100 });
      setRows(res.clients);
    };
    run();
  }, []);

  return (
    <div>
      <Title level={3}>Clients</Title>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Company', dataIndex: 'companyName' },
          { title: 'Tier', dataIndex: 'subscriptionTier', render: (t) => <Tag color={t === 'enterprise' ? 'purple' : t === 'premium' ? 'gold' : 'blue'}>{t}</Tag> },
          { title: 'Status', dataIndex: 'isActive', render: (a) => <Tag color={a ? 'green' : 'red'}>{a ? 'Active' : 'Inactive'}</Tag> },
        ]}
      />
    </div>
  );
};

export default ClientsPage;
