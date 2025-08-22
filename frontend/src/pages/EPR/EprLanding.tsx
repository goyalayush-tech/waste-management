import React from 'react';
import { Card, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const EprLanding: React.FC = () => {
  return (
    <div className="epr-landing">
      <Title level={2}>EPR Compliance</Title>
      <Paragraph>Manage documents, run OCR, view compliance scores, and maintain recycler records.</Paragraph>
      <Space size="large" wrap>
        <Card title="Upload Document" actions={[<Link to="/epr/upload" key="u">Open</Link>]}>Upload invoices and weighbridge slips for OCR.</Card>
        <Card title="Documents" actions={[<Link to="/epr/documents" key="d">Open</Link>]}>Browse uploaded documents, status, and results.</Card>
        <Card title="Compliance" actions={[<Link to="/epr/compliance" key="c">Open</Link>]}>View compliance scores and history.</Card>
        <Card title="Recyclers" actions={[<Link to="/epr/recyclers" key="r">Open</Link>]}>Recycler master database and GST checks.</Card>
        <Card title="Clients" actions={[<Link to="/epr/clients" key="cl">Open</Link>]}>Client list and subscription tier.</Card>
      </Space>
    </div>
  );
};

export default EprLanding;
