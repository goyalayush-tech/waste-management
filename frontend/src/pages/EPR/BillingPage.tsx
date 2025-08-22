import React, { useEffect, useState } from 'react';
import { eprClient } from '@/services/api';
import { Table, Typography, Button, Space, InputNumber, message } from 'antd';

const { Title } = Typography;

const BillingPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(1000);
  const clientId = 'client_1';

  const load = async () => {
    setLoading(true);
    try {
      const client = eprClient();
      const res = await client.getBillingRecords(clientId);
      setRows(res.records);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      const client = eprClient();
      await client.createBillingRecord(clientId, {
        amount,
        currency: 'INR',
        description: 'Manual charge',
        status: 'pending',
        billingPeriod: {
          startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          endDate: new Date().toISOString(),
        },
      } as any);
      message.success('Record created');
      load();
    } catch (e: any) {
      message.error(e.message || 'Failed to create record');
    }
  };

  return (
    <div>
      <Title level={3}>Billing</Title>
      <Space style={{ marginBottom: 12 }}>
        <InputNumber min={0} value={amount} onChange={(v) => setAmount(Number(v))} />
        <Button type="primary" onClick={create}>Create Record</Button>
      </Space>
      <Table
        loading={loading}
        rowKey="id"
        dataSource={rows}
        columns={[
          { title: 'Amount', dataIndex: 'amount' },
          { title: 'Currency', dataIndex: 'currency' },
          { title: 'Description', dataIndex: 'description' },
          { title: 'Status', dataIndex: 'status' },
          { title: 'Start', dataIndex: ['billingPeriod','startDate'] },
          { title: 'End', dataIndex: ['billingPeriod','endDate'] },
        ]}
      />
    </div>
  );
};

export default BillingPage;
