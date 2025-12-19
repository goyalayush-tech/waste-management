import React, { useState, useCallback } from 'react';
import {
  Upload,
  Card,
  Progress,
  Button,
  Select,
  Alert,
  Typography,
  Spin,
  message,
  Image,
} from 'antd';
import {
  InboxOutlined,
  FileImageOutlined,
  EyeOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { OCRResult, DocumentTemplate } from '../types';
import { ocrService } from '../services/ocrService';

const { Dragger } = Upload;
const { Title, Text } = Typography;
const { Option } = Select;

interface DocumentUploadWithOCRProps {
  claimId: string;
  onOCRComplete?: (result: OCRResult) => void;
  onFileUpload?: (file: File, url: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  showTemplateSelection?: boolean;
}

const DocumentUploadWithOCR: React.FC<DocumentUploadWithOCRProps> = ({
  claimId,
  onOCRComplete,
  onFileUpload,
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  maxSize = 10,
  showTemplateSelection = true,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      file: File;
      url: string;
      ocrResult?: OCRResult;
      processing: boolean;
      error?: string;
    }>
  >([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load document templates on mount
  React.useEffect(() => {
    if (showTemplateSelection) {
      loadTemplates();
    }
  }, [showTemplateSelection]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const templatesData = await ocrService.getDocumentTemplates();
      setTemplates(templatesData);
    } catch (error) {
      message.error('Failed to load document templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const processOCR = async (_file: File, url: string, fileIndex: number) => {
    try {
      // Update file status to processing
      setUploadedFiles(prev =>
        prev.map((item, index) =>
          index === fileIndex ? { ...item, processing: true, error: undefined } : item
        )
      );

      const documentId = `${claimId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Determine document type from selected template or file name
      const selectedTemplateData = templates.find(t => t.templateId === selectedTemplate);
      const documentType = selectedTemplateData?.documentType || 'general';

      // Start OCR processing
      const ocrResult = await ocrService.processDocument({
        documentId,
        documentUrl: url,
        documentType,
        templateId: selectedTemplate || undefined,
        language: 'en',
      });

      // Update file with OCR result
      setUploadedFiles(prev =>
        prev.map((item, index) =>
          index === fileIndex
            ? { ...item, ocrResult, processing: false }
            : item
        )
      );

      // Notify parent component
      onOCRComplete?.(ocrResult);
      
      message.success('Document processed successfully!');
    } catch (error) {
      console.error('OCR processing failed:', error);
      
      // Update file with error
      setUploadedFiles(prev =>
        prev.map((item, index) =>
          index === fileIndex
            ? { 
                ...item, 
                processing: false, 
                error: error instanceof Error ? error.message : 'OCR processing failed'
              }
            : item
        )
      );

      message.error('Failed to process document');
    }
  };

  const handleUpload = useCallback<NonNullable<UploadProps['customRequest']>>(
    async (options) => {
      const { file, onSuccess, onError } = options;
      const rcFile = file as RcFile;

      try {
        // Validate file type
        if (!acceptedTypes.includes(rcFile.type)) {
          throw new Error(`File type ${rcFile.type} is not supported`);
        }

        // Validate file size
        if (rcFile.size > maxSize * 1024 * 1024) {
          throw new Error(`File size must be less than ${maxSize}MB`);
        }

        // Create file URL for preview and processing
        const url = URL.createObjectURL(rcFile);
        
        // Add file to uploaded files list
        const newFileIndex = uploadedFiles.length;
        const newFile = {
          file: rcFile,
          url,
          processing: false,
        };
        
        setUploadedFiles(prev => [...prev, newFile]);

        // Notify parent about file upload
        onFileUpload?.(rcFile, url);

        // Start OCR processing automatically
        setTimeout(() => {
          processOCR(rcFile, url, newFileIndex);
        }, 500);

        onSuccess?.(url);
      } catch (error) {
        console.error('File upload failed:', error);
        onError?.(error as Error);
        message.error(error instanceof Error ? error.message : 'Upload failed');
      }
    },
    [acceptedTypes, maxSize, onFileUpload, onOCRComplete, uploadedFiles.length, selectedTemplate, templates]
  );

  const reprocessDocument = async (fileIndex: number) => {
    const fileItem = uploadedFiles[fileIndex];
    if (!fileItem) return;

    await processOCR(fileItem.file, fileItem.url, fileIndex);
  };

  const removeFile = (fileIndex: number) => {
    const fileItem = uploadedFiles[fileIndex];
    if (fileItem?.url) {
      URL.revokeObjectURL(fileItem.url);
    }
    
    setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex));
  };

  const getProcessingStatus = (file: typeof uploadedFiles[0]) => {
    if (file.processing) {
      return <Spin size="small" />;
    }
    if (file.error) {
      return <ExclamationCircleOutlined className="text-red-500" />;
    }
    if (file.ocrResult) {
      return <CheckCircleOutlined className="text-green-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {showTemplateSelection && (
        <Card size="small">
          <div className="flex items-center space-x-4">
            <Text strong>Document Template:</Text>
            <Select
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              placeholder="Select document type (optional)"
              className="flex-1 max-w-xs"
              loading={loadingTemplates}
              allowClear
            >
              {templates.map(template => (
                <Option key={template.templateId} value={template.templateId}>
                  {template.templateName}
                </Option>
              ))}
            </Select>
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined />}
              onClick={loadTemplates}
              loading={loadingTemplates}
            >
              Refresh
            </Button>
          </div>
          {selectedTemplate && (
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <Text type="secondary" className="text-sm">
                {templates.find(t => t.templateId === selectedTemplate)?.expectedFields.length || 0} fields will be extracted
              </Text>
            </div>
          )}
        </Card>
      )}

      <Card>
        <Dragger
          multiple
          customRequest={handleUpload}
          showUploadList={false}
          className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors"
        >
          <div className="p-8">
            <InboxOutlined className="text-4xl text-gray-400 mb-4" />
            <Title level={4} className="text-gray-600 mb-2">
              Upload Documents for OCR Processing
            </Title>
            <Text type="secondary">
              Drag & drop files here, or click to select
            </Text>
            <div className="mt-4 text-sm text-gray-500">
              <div>Supported formats: JPG, PNG, PDF</div>
              <div>Maximum file size: {maxSize}MB</div>
            </div>
          </div>
        </Dragger>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <Title level={4}>Uploaded Documents</Title>
          
          {uploadedFiles.map((fileItem, index) => (
            <Card key={index} size="small">
              <div className="flex items-start space-x-4">
                {/* File Preview */}
                <div className="flex-shrink-0">
                  {fileItem.file.type.startsWith('image/') ? (
                    <Image
                      src={fileItem.url}
                      alt={fileItem.file.name}
                      width={80}
                      height={60}
                      className="object-cover rounded"
                      preview={{
                        mask: <EyeOutlined />,
                      }}
                    />
                  ) : (
                    <div className="w-20 h-15 bg-gray-100 rounded flex items-center justify-center">
                      <FileImageOutlined className="text-2xl text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info & OCR Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <Text strong className="truncate">
                      {fileItem.file.name}
                    </Text>
                    <div className="flex items-center space-x-2">
                      {getProcessingStatus(fileItem)}
                      <Button
                        type="link"
                        size="small"
                        onClick={() => removeFile(index)}
                        danger
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <Text type="secondary" className="text-sm">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)}MB
                  </Text>

                  {fileItem.processing && (
                    <div className="mt-2">
                      <Progress
                        percent={undefined}
                        status="active"
                        size="small"
                        showInfo={false}
                      />
                      <Text type="secondary" className="text-sm">
                        Processing document...
                      </Text>
                    </div>
                  )}

                  {fileItem.error && (
                    <div className="mt-2">
                      <Alert
                        type="error"
                        message="OCR Processing Failed"
                        description={fileItem.error}
                        action={
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => reprocessDocument(index)}
                          >
                            Retry
                          </Button>
                        }
                      />
                    </div>
                  )}

                  {fileItem.ocrResult && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <Text type="success" className="text-sm">
                          ✅ OCR Complete
                        </Text>
                        <div className="text-sm">
                          Confidence:{' '}
                          <span
                            className={`font-semibold ${
                              fileItem.ocrResult.confidence >= 0.9
                                ? 'text-green-600'
                                : fileItem.ocrResult.confidence >= 0.7
                                ? 'text-amber-500'
                                : 'text-red-500'
                            }`}
                          >
                            {Math.round(fileItem.ocrResult.confidence * 100)}%
                          </span>
                        </div>
                      </div>

                      {fileItem.ocrResult.extractedFields.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <Text strong>Extracted {fileItem.ocrResult.extractedFields.length} fields:</Text>
                          <div className="mt-1 space-y-1">
                            {fileItem.ocrResult.extractedFields.slice(0, 3).map((field, fieldIndex) => (
                              <div key={fieldIndex} className="flex justify-between">
                                <span className="text-gray-600 capitalize">
                                  {field.fieldName.replace(/_/g, ' ')}:
                                </span>
                                <span className="font-medium">
                                  {field.extractedValue}
                                </span>
                              </div>
                            ))}
                            {fileItem.ocrResult.extractedFields.length > 3 && (
                              <div className="text-gray-500">
                                +{fileItem.ocrResult.extractedFields.length - 3} more fields
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        type="link"
                        size="small"
                        onClick={() => reprocessDocument(index)}
                        className="mt-2"
                      >
                        Reprocess Document
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {uploadedFiles.some(f => f.ocrResult) && (
        <Alert
          type="info"
          message="OCR Processing Complete"
          description="Review the extracted data below and make any necessary corrections before submitting your claim."
          showIcon
        />
      )}
    </div>
  );
};

export default DocumentUploadWithOCR;