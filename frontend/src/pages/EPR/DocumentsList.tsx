import React, { useEffect, useState } from 'react';
import { eprClient } from '@/services/api';
import { Table, Typography, Tag, Space, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const DocumentsList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const client = eprClient();
        const res = await client.getDocuments({ limit: 100 });
        setData(res.documents);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div>
      <Title level={3}>Documents</Title>
      <Table
        loading={loading}
        rowKey="id"
        dataSource={data}
        columns={[
          { title: 'Filename', dataIndex: 'filename' },
          { title: 'Type', dataIndex: 'documentType' },
          { title: 'Size (bytes)', dataIndex: 'size' },
          { title: 'Uploaded At', dataIndex: 'uploadedAt' },
          { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'uploaded' ? 'blue' : s === 'processing' ? 'gold' : s === 'processed' ? 'green' : 'red'}>{s}</Tag> },
          { title: 'Action', render: (_, r) => <Space><Button onClick={() => navigate(`/epr/documents/${r.id}`)}>View</Button></Space> },
        ]}
      />
    </div>
  );
};

export default DocumentsList;
