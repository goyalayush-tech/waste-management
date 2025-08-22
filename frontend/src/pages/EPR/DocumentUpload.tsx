import React, { useState } from 'react';
import { Button, Card, Form, Progress, Select, Upload, message, Typography, Space, List, Tag } from 'antd';
import { InboxOutlined, FileDoneOutlined, SyncOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { eprClient } from '@/services/api';
import styles from './DocumentUpload.module.css';

const { Dragger } = Upload;
const { Title, Paragraph, Text } = Typography;

const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.png,.jpg,.jpeg,.pdf',
    beforeUpload: (f) => {
      setFile(f as File);
      return false; // prevent auto-upload
    },
    onRemove: () => {
      setFile(null);
      return true;
    },
  };

  const handleUpload = async (values: any) => {
    if (!file) {
      message.error('Please select a file first');
      return;
    }
    try {
      setUploading(true);
      setProgress(0);
      const client = eprClient();
      const res = await client.uploadDocument(
        {
          file,
          documentType: values.documentType,
          metadata: { notes: values.notes || '' },
        },
        (p) => setProgress(p)
      );
      setDocumentId(res.documentId);
      message.success('Uploaded. Starting OCR...');

      // Start OCR
      await client.processOcr(res.documentId);
      setOcrStatus('pending');

      // Poll status
      const poll = async () => {
        try {
          const status = await client.getOcrStatus(res.documentId);
          setOcrStatus(status.status);
          if (status.status === 'completed') {
            const result = await client.getOcrResult(res.documentId);
            setOcrResult(result);
          } else if (status.status === 'failed') {
            message.error('OCR failed');
          } else {
            setTimeout(poll, 1500);
          }
        } catch (err: any) {
          message.error(err.message || 'Failed to get OCR status');
        }
      };
      setTimeout(poll, 1500);
    } catch (err: any) {
      message.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Title level={2}>EPR Document Upload</Title>
      <Paragraph>Upload invoices, weighbridge slips, or certificates. We will run OCR and prepare them for compliance checks.</Paragraph>

      <Card>
        <Form layout="vertical" onFinish={handleUpload}>
          <Form.Item name="documentType" label="Document Type" initialValue="invoice" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Invoice', value: 'invoice' },
                { label: 'Weighbridge', value: 'weighbridge' },
                { label: 'Certificate', value: 'certificate' },
                { label: 'Other', value: 'other' },
              ]}
            />
          </Form.Item>

          <Form.Item name="file" label="File" rules={[{ required: true }]}
            valuePropName="fileList" getValueFromEvent={() => (file ? [file] : [])}
          >
            <Dragger {...uploadProps} disabled={uploading} style={{ padding: 16 }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">Support for a single upload. Strictly prohibit from uploading company data or other band files</p>
            </Dragger>
          </Form.Item>

          {uploading && <Progress percent={progress} />}

          <Form.Item name="notes" label="Notes">
            <textarea rows={3} className={styles.notes} placeholder="Optional notes" />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={uploading} disabled={!file}>Upload & OCR</Button>
            {documentId && <Text type="secondary">Document ID: {documentId}</Text>}
          </Space>
        </Form>
      </Card>

      {ocrStatus && (
        <Card style={{ marginTop: 16 }} title="OCR Status">
          <Space>
            {ocrStatus === 'pending' && <Tag icon={<SyncOutlined spin />} color="processing">Processing</Tag>}
            {ocrStatus === 'completed' && <Tag icon={<FileDoneOutlined />} color="success">Completed</Tag>}
          </Space>
        </Card>
      )}

      {ocrResult && (
        <Card style={{ marginTop: 16 }} title="OCR Result">
          <List
            size="small"
            bordered
            dataSource={Object.entries(ocrResult.extractedData || {})}
      renderItem={([k, v]) => (
              <List.Item>
        <strong className={styles.key}>{k}:</strong>
                <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </List.Item>
            )}
          />
          <Paragraph style={{ marginTop: 12 }}>
            Confidence: <strong>{Math.round((ocrResult.confidence || 0) * 100)}%</strong>
          </Paragraph>
        </Card>
      )}
    </div>
  );
};

export default DocumentUpload;
