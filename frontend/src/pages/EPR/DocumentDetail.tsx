import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eprClient } from '@/services/api';
import { Card, Typography, Descriptions, Button, Space, message } from 'antd';

const { Title, Paragraph } = Typography;

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<any | null>(null);
  const [ocr, setOcr] = useState<any | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const client = eprClient();
      try {
        const d = await client.getDocumentById(id);
        setDoc(d);
        const r = await client.getOcrResult(id).catch(() => null);
        setOcr(r);
      } catch (e: any) {
        message.error(e.message || 'Failed to load');
      }
    };
    run();
  }, [id]);

  const startAudit = async () => {
    if (!id) return;
    try {
      const client = eprClient();
      await client.submitForAudit(id);
      const result = await client.getAuditResult(id);
      message.success(`Audit status: ${result.complianceStatus}`);
    } catch (e: any) {
      message.error(e.message || 'Audit failed');
    }
  };

  return (
    <div>
      <Title level={3}>Document Detail</Title>
      {doc && (
        <Card title={doc.filename}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="ID">{doc.id}</Descriptions.Item>
            <Descriptions.Item label="Type">{doc.documentType}</Descriptions.Item>
            <Descriptions.Item label="Size">{doc.size}</Descriptions.Item>
            <Descriptions.Item label="Uploaded At">{doc.uploadedAt}</Descriptions.Item>
            <Descriptions.Item label="Status">{doc.status}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {ocr && (
        <Card title="OCR Extracted Data" style={{ marginTop: 16 }}>
          <Paragraph>Confidence: {Math.round((ocr.confidence || 0) * 100)}%</Paragraph>
          <pre>{JSON.stringify(ocr.extractedData, null, 2)}</pre>
        </Card>
      )}

      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={startAudit}>Start Audit</Button>
      </Space>
    </div>
  );
};

export default DocumentDetail;
