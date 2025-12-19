import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Tag,
  Space,
  Alert,
  Typography,
  Progress,
  Modal,
  Tooltip,
  message,
} from 'antd';
import {
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { OCRResult, OCRField } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface OCRResultsReviewProps {
  ocrResults: OCRResult[];
  onValidationComplete?: (validatedResults: OCRResult[]) => void;
  onFieldCorrection?: (documentId: string, fieldName: string, correctedValue: string) => void;
  editable?: boolean;
  showPreview?: boolean;
}

interface EditingField {
  documentId: string;
  fieldName: string;
  value: string;
}

const OCRResultsReview: React.FC<OCRResultsReviewProps> = ({
  ocrResults,
  onValidationComplete,
  onFieldCorrection,
  editable = true,
  showPreview = true,
}) => {
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [validatedFields, setValidatedFields] = useState<Record<string, Record<string, boolean>>>({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<OCRResult | null>(null);
  const [form] = Form.useForm();

  const handleFieldEdit = (documentId: string, fieldName: string, currentValue: string) => {
    setEditingField({ documentId, fieldName, value: currentValue });
    form.setFieldsValue({ editValue: currentValue });
  };

  const handleFieldSave = async () => {
    if (!editingField) return;

    try {
      const values = await form.validateFields(['editValue']);
      const correctedValue = values.editValue;

      // Update the field in the results
      const updatedResults = ocrResults.map(result => ({
        ...result,
        extractedFields: result.extractedFields.map(field =>
          result.documentId === editingField.documentId && field.fieldName === editingField.fieldName
            ? { ...field, extractedValue: correctedValue, validated: true }
            : field
        ),
      }));

      // Mark field as validated
      setValidatedFields(prev => ({
        ...prev,
        [editingField.documentId]: {
          ...prev[editingField.documentId],
          [editingField.fieldName]: true,
        },
      }));

      // Notify parent components
      onFieldCorrection?.(editingField.documentId, editingField.fieldName, correctedValue);
      onValidationComplete?.(updatedResults);

      setEditingField(null);
      message.success('Field updated successfully');
    } catch (error) {
      message.error('Please enter a valid value');
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    form.resetFields(['editValue']);
  };

  const markFieldAsValid = (documentId: string, fieldName: string) => {
    setValidatedFields(prev => ({
      ...prev,
      [documentId]: {
        ...prev[documentId],
        [fieldName]: true,
      },
    }));

    // Update the field validation status
    const updatedResults = ocrResults.map(result => ({
      ...result,
      extractedFields: result.extractedFields.map(field =>
        result.documentId === documentId && field.fieldName === fieldName
          ? { ...field, validated: true }
          : field
      ),
    }));

    onValidationComplete?.(updatedResults);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Tag color="success">High ({Math.round(confidence * 100)}%)</Tag>;
    }
    if (confidence >= 0.7) {
      return <Tag color="warning">Medium ({Math.round(confidence * 100)}%)</Tag>;
    }
    return <Tag color="error">Low ({Math.round(confidence * 100)}%)</Tag>;
  };

  const isFieldValidated = (documentId: string, fieldName: string) => {
    return validatedFields[documentId]?.[fieldName] || false;
  };

  const getFieldValidationStatus = (documentId: string, field: OCRField) => {
    const validated = isFieldValidated(documentId, field.fieldName);
    
    if (validated || field.validated) {
      return <CheckOutlined className="text-green-500" />;
    }
    
    if (field.confidence < 0.7) {
      return <WarningOutlined className="text-amber-500" />;
    }
    
    return <InfoCircleOutlined className="text-gray-400" />;
  };

  const showDocPreview = (result: OCRResult) => {
    setPreviewDocument(result);
    setPreviewVisible(true);
  };

  const columns: ColumnsType<OCRField & { documentId: string; documentType: string }> = [
    {
      title: 'Field',
      dataIndex: 'fieldName',
      key: 'fieldName',
      render: (fieldName: string) => (
        <Text strong className="capitalize">
          {fieldName.replace(/_/g, ' ')}
        </Text>
      ),
    },
    {
      title: 'Extracted Value',
      dataIndex: 'extractedValue',
      key: 'extractedValue',
      render: (value: string, record) => {
        const isEditing = editingField?.documentId === record.documentId && 
                         editingField?.fieldName === record.fieldName;

        if (isEditing) {
          return (
            <Form form={form} style={{ margin: 0 }}>
              <Form.Item
                name="editValue"
                style={{ margin: 0 }}
                rules={[{ required: true, message: 'Please enter a value' }]}
              >
                <Input
                  size="small"
                  autoFocus
                  onPressEnter={handleFieldSave}
                  onBlur={handleFieldCancel}
                />
              </Form.Item>
            </Form>
          );
        }

        return (
          <div className="flex items-center justify-between">
            <Text
              className={`flex-1 ${
                isFieldValidated(record.documentId, record.fieldName) 
                  ? 'text-green-600' 
                  : record.confidence < 0.7 
                  ? 'text-amber-600' 
                  : ''
              }`}
            >
              {value || '-'}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 120,
      render: (confidence: number) => getConfidenceBadge(confidence),
    },
    {
      title: 'Status',
      key: 'status',
      width: 80,
      render: (_: any, record) => getFieldValidationStatus(record.documentId, record),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record) => {
        const validated = isFieldValidated(record.documentId, record.fieldName);
        const isEditing = editingField?.documentId === record.documentId && 
                         editingField?.fieldName === record.fieldName;

        if (isEditing) {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleFieldSave}
              />
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={handleFieldCancel}
              />
            </Space>
          );
        }

        if (validated || !editable) {
          return <Text type="secondary">Validated</Text>;
        }

        return (
          <Space>
            <Tooltip title="Edit field value">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleFieldEdit(
                  record.documentId,
                  record.fieldName,
                  record.extractedValue
                )}
              />
            </Tooltip>
            <Tooltip title="Mark as correct">
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => markFieldAsValid(record.documentId, record.fieldName)}
                className="text-green-500 hover:text-green-600"
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Prepare data for table
  const tableData = ocrResults.flatMap(result =>
    result.extractedFields.map(field => ({
      ...field,
      documentId: result.documentId,
      documentType: result.documentType,
      key: `${result.documentId}-${field.fieldName}`,
    }))
  );

  const getOverallProgress = () => {
    const totalFields = tableData.length;
    const validatedFieldsCount = tableData.filter(field => 
      isFieldValidated(field.documentId, field.fieldName) || field.validated
    ).length;
    
    return totalFields > 0 ? Math.round((validatedFieldsCount / totalFields) * 100) : 0;
  };

  const getLowConfidenceFields = () => {
    return tableData.filter(field => field.confidence < 0.7);
  };

  if (ocrResults.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Text type="secondary">No OCR results to review</Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Title level={4} className="mb-2">Validation Progress</Title>
            <Progress
              percent={getOverallProgress()}
              status={getOverallProgress() === 100 ? 'success' : 'active'}
              strokeColor={getOverallProgress() === 100 ? '#22c55e' : '#1890ff'}
            />
            <Text type="secondary" className="text-sm">
              {tableData.filter(f => isFieldValidated(f.documentId, f.fieldName) || f.validated).length} of {tableData.length} fields validated
            </Text>
          </div>
          
          <div>
            <Title level={4} className="mb-2">Documents Processed</Title>
            <div className="text-2xl font-bold text-blue-600">{ocrResults.length}</div>
            <Text type="secondary" className="text-sm">
              Total documents
            </Text>
          </div>
          
          <div>
            <Title level={4} className="mb-2">Fields Extracted</Title>
            <div className="text-2xl font-bold text-green-600">{tableData.length}</div>
            <Text type="secondary" className="text-sm">
              Total fields found
            </Text>
          </div>
        </div>

        {getLowConfidenceFields().length > 0 && (
          <Alert
            type="warning"
            className="mt-4"
            message={`${getLowConfidenceFields().length} fields have low confidence scores`}
            description="Please review and validate these fields carefully before submitting."
            showIcon
          />
        )}
      </Card>

      {/* Document Results */}
      <Card title="Extracted Fields Review">
        <div className="space-y-4">
          {ocrResults.map((result, index) => (
            <Card key={result.documentId} size="small" className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Title level={5} className="mb-1">
                    Document {index + 1}
                  </Title>
                  <div className="flex items-center space-x-4">
                    <Text type="secondary">Type: {result.documentType}</Text>
                    <Text type="secondary">
                      Overall Confidence: {Math.round(result.confidence * 100)}%
                    </Text>
                    <Text type="secondary">
                      Fields: {result.extractedFields.length}
                    </Text>
                  </div>
                </div>
                
                {showPreview && (
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => showDocPreview(result)}
                  >
                    Preview
                  </Button>
                )}
              </div>

              <Table
                columns={columns}
                dataSource={result.extractedFields.map(field => ({
                  ...field,
                  documentId: result.documentId,
                  documentType: result.documentType,
                  key: `${result.documentId}-${field.fieldName}`,
                }))}
                pagination={false}
                size="small"
              />
            </Card>
          ))}
        </div>
      </Card>

      {/* Raw Text Preview Modal */}
      <Modal
        title="Document Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {previewDocument && (
          <div className="space-y-4">
            <div>
              <Text strong>Document Type:</Text> {previewDocument.documentType}
            </div>
            <div>
              <Text strong>Processing Time:</Text> {previewDocument.processingTime}ms
            </div>
            <div>
              <Text strong>Language:</Text> {previewDocument.language}
            </div>
            
            <div>
              <Text strong>Raw Extracted Text:</Text>
              <TextArea
                value={previewDocument.rawText}
                readOnly
                rows={12}
                className="mt-2"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OCRResultsReview;