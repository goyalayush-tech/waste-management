import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Input, Select, Space, message, Row, Col, Divider } from 'antd';
import { Card as AntCard } from 'antd';
import styles from './ClaimNew.module.css';
import {
  PlusOutlined,
  UploadOutlined,
  AuditOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { createClaim, uploadDocument, runAudit } from '../api';
import type { Claim } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface FormState {
  brandId: string;
  recyclerId: string;
  facilityId: string;
  claimedWeightKg: number | string;
  periodFrom: string;
  periodTo: string;
}

const initialForm: FormState = {
  brandId: '',
  recyclerId: '',
  facilityId: '',
  claimedWeightKg: '',
  periodFrom: '',
  periodTo: '',
};

const docTypes = ['invoice', 'weighbridge', 'photo', 'gps', 'license', 'other'];

export default function ClaimNew() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [currentClaim, setCurrentClaim] = useState<Claim | null>(null);
  const [docType, setDocType] = useState<string>('invoice');
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateForm = (key: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateClaim = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validate required fields
      if (!form.brandId.trim()) {
        setError('Brand ID is required');
        message.error('Brand ID is required');
        return;
      }
      if (!form.recyclerId.trim()) {
        setError('Recycler ID is required');
        message.error('Recycler ID is required');
        return;
      }
      if (!form.facilityId.trim()) {
        setError('Facility ID is required');
        message.error('Facility ID is required');
        return;
      }
      if (!form.periodFrom) {
        setError('Period From date is required');
        message.error('Period From date is required');
        return;
      }
      if (!form.periodTo) {
        setError('Period To date is required');
        message.error('Period To date is required');
        return;
      }
      if (!form.claimedWeightKg || Number(form.claimedWeightKg) <= 0) {
        setError('Claimed weight must be greater than 0');
        message.error('Claimed weight must be greater than 0');
        return;
      }

      const payload = {
        brandId: form.brandId.trim(),
        recyclerId: form.recyclerId.trim(),
        facilityId: form.facilityId.trim(),
        claimedWeightKg: Number(form.claimedWeightKg),
        period: {
          from: new Date(form.periodFrom).toISOString(),
          to: new Date(form.periodTo).toISOString(),
        },
      };

      const response = await createClaim(payload);
      setCurrentClaim(response.data);
      setStatusMessage('Claim created. You can now upload documents.');
      message.success('Claim created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create claim');
      message.error('Failed to create claim');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!currentClaim || !file) {
      setError('Select a file and ensure the claim exists.');
      message.error('Select a file and ensure the claim exists.');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      await uploadDocument(currentClaim._id, file, docType);
      setStatusMessage('Document uploaded successfully.');
      setFile(null);
      message.success('Document uploaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      message.error('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    if (!currentClaim) {
      setError('Create a claim first.');
      message.error('Create a claim first.');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const response = await runAudit(currentClaim._id);
      setStatusMessage(`Audit completed. Score: ${response.data.score}`);
      message.success(`Audit completed. Score: ${response.data.score}`);
      setTimeout(() => navigate(`/app/claimclean/${currentClaim._id}`), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run audit');
      message.error('Failed to run audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Animated Background Elements */}
      <div className={styles.floatingCircle1} />
      <div className={styles.floatingCircle2} />
      <div className={styles.floatingCircle3} />

      <div className={styles.contentWrapper}>
        <div className={styles.contentContainer}>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <Title level={1} className={styles.pageTitle}>
              <PlusOutlined className={styles.pageTitleIcon} />
              Create New Claim
            </Title>
            <Text className={styles.pageSubtitle}>
              Submit a new waste recycling claim for verification
            </Text>
          </div>

          <Row gutter={[24, 24]}>
            {/* Claim Form */}
            <Col xs={24} lg={12}>
              <AntCard className={styles.card}>
                <div className={styles.cardContent}>
                  <Title level={3} className={styles.cardTitle}>
                    <FileTextOutlined className={styles.cardTitleIcon} />
                    Claim Information
                  </Title>

                  <Space direction="vertical" className={styles.fullWidth}>
                    <div>
                      <Text strong className={styles.formLabel}>Brand ID</Text>
                      <Input
                        value={form.brandId}
                        onChange={(e) => updateForm('brandId', e.target.value)}
                        placeholder="Enter brand identifier"
                        className={styles.formInput}
                      />
                    </div>

                    <div>
                      <Text strong className={styles.formLabel}>Recycler ID</Text>
                      <Input
                        value={form.recyclerId}
                        onChange={(e) => updateForm('recyclerId', e.target.value)}
                        placeholder="Enter recycler identifier"
                        className={styles.formInput}
                      />
                    </div>

                    <div>
                      <Text strong className={styles.formLabel}>Facility ID</Text>
                      <Input
                        value={form.facilityId}
                        onChange={(e) => updateForm('facilityId', e.target.value)}
                        placeholder="Enter facility identifier"
                        className={styles.formInput}
                      />
                    </div>

                    <div>
                      <Text strong className={styles.formLabel}>Claimed Weight (kg)</Text>
                      <Input
                        type="number"
                        value={form.claimedWeightKg}
                        onChange={(e) => updateForm('claimedWeightKg', e.target.value)}
                        placeholder="Enter weight in kilograms"
                        className={styles.formInput}
                      />
                    </div>

                    <div>
                      <Text strong className={styles.formLabel}>Period From</Text>
                      <Input
                        type="date"
                        value={form.periodFrom}
                        onChange={(e) => updateForm('periodFrom', e.target.value)}
                        className={styles.formInput}
                      />
                    </div>

                    <div>
                      <Text strong className={styles.formLabel}>Period To</Text>
                      <Input
                        type="date"
                        value={form.periodTo}
                        onChange={(e) => updateForm('periodTo', e.target.value)}
                        className={styles.formInput}
                      />
                    </div>

                    <Button
                      type="primary"
                      onClick={handleCreateClaim}
                      loading={loading}
                      className={styles.createButton}
                    >
                      Create Claim
                    </Button>
                  </Space>
                </div>
              </AntCard>
            </Col>

            {/* Document Upload & Audit */}
            <Col xs={24} lg={12}>
              <AntCard className={styles.card}>
                <div className={styles.cardContent}>
                  <Title level={3} className={styles.cardTitle}>
                    <UploadOutlined className={styles.cardTitleIcon} />
                    Document Upload
                  </Title>

                  {currentClaim && (
                    <div className={styles.claimCreatedInfo}>
                      <Text className={styles.claimCreatedText}>
                        ✓ Claim created: {currentClaim._id}
                      </Text>
                    </div>
                  )}

                  <Space direction="vertical" className={styles.fullWidth}>
                    <div>
                      <Text strong className={styles.formLabel}>Document Type</Text>
                      <Select
                        value={docType}
                        onChange={setDocType}
                        className={styles.fullWidth}
                      >
                        {docTypes.map((type) => (
                          <Option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Text strong className={styles.formLabel}>Select File</Text>
                      <Input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className={styles.formInput}
                      />
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={!currentClaim || !file}
                      loading={loading}
                      className={styles.uploadButton}
                    >
                      Upload Document
                    </Button>

                    <Divider />

                    <Button
                      type="primary"
                      onClick={handleRunAudit}
                      disabled={!currentClaim}
                      loading={loading}
                      className={styles.auditButton}
                    >
                      <AuditOutlined className={styles.buttonIcon} />
                      Run Audit
                    </Button>
                  </Space>
                </div>
              </AntCard>
            </Col>
          </Row>

          {/* Status Messages */}
          {statusMessage && (
            <div className={styles.successMessage}>
              <CheckCircleOutlined className={styles.successIcon} />
              <Text className={styles.successText}>{statusMessage}</Text>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <ExclamationCircleOutlined className={styles.errorIcon} />
              <Text className={styles.errorText}>{error}</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}