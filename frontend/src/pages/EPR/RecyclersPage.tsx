import React, { useEffect, useState } from 'react';
import { eprClient } from '@/services/api';
import { Table, Typography, Button, Space, message } from 'antd';

const { Title } = Typography;

const RecyclersPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const client = eprClient();
        const res = await client.getRecyclers();
        setRows(res.recyclers);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const validateGst = async (gst: string) => {
    try {
      const client = eprClient();
      const res = await client.validateGst(gst);
      message.info(res.isValid ? 'GST valid' : 'GST invalid');
    } catch (e: any) {
      message.error(e.message || 'Validation failed');
    }
  };

  return (
    <div>
      <Title level={3}>Recyclers</Title>
      <Table
        loading={loading}
        rowKey="id"
        dataSource={rows}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'GST', dataIndex: 'gstNumber' },
          { title: 'Risk', dataIndex: 'riskProfile' },
          { title: 'Action', render: (_, r) => (
            <Space>
              <Button onClick={() => validateGst(r.gstNumber)}>Validate GST</Button>
            </Space>
          ) },
        ]}
      />
    </div>
  );
};

export default RecyclersPage;
