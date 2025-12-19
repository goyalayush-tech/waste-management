import React, { useState, useCallback, useRef } from 'react';
import { Upload, Button, Progress, message, Card, Typography, Space, Row, Col, Tag, Alert, Tooltip, Badge } from 'antd';
import { 
  UploadOutlined, 
  InboxOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CameraOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { eprClient } from '@/services/api';

const { Dragger } = Upload;
const { Text, Title } = Typography;

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface DragDropUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  onFilesChange?: (files: UploadFile[]) => void;
  onUploadProgress?: (progress: FileUploadProgress[]) => void;
  onUploadComplete?: (files: UploadFile[]) => void;
  onUploadError?: (error: string, fileName?: string) => void;
  uploadType?: 'waste-images' | 'epr-documents';
  enableCamera?: boolean;
  enableBulkUpload?: boolean;
  enableRetry?: boolean;
  className?: string;
  customUploadHandler?: (files: File[]) => Promise<UploadFile[]>;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  accept = 'image/*,.pdf',
  multiple = true,
  maxFiles = 10,
  maxSize = 10, // 10MB default
  onFilesChange,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  uploadType = 'waste-images',
  enableCamera = false,
  enableBulkUpload = true,
  enableRetry = true,
  className = '',
  customUploadHandler
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressList, setUploadProgressList] = useState<FileUploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [failedUploads, setFailedUploads] = useState<string[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((newFileList: UploadFile[]) => {
    setFileList(newFileList);
    onFilesChange?.(newFileList);
  }, [onFilesChange]);

  const beforeUpload = (file: File): boolean => {
    // Check file size
    const isValidSize = file.size / 1024 / 1024 < maxSize;
    if (!isValidSize) {
      message.error(`File must be smaller than ${maxSize}MB!`);
      return false;
    }

    // Check file count
    if (fileList.length >= maxFiles) {
      message.error(`You can only upload up to ${maxFiles} files!`);
      return false;
    }

    // Check file type based on upload type
    if (uploadType === 'waste-images') {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files for waste verification!');
        return false;
      }
    } else if (uploadType === 'epr-documents') {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValidType) {
        message.error('You can only upload images or PDF files for EPR documents!');
        return false;
      }
    }

    return false; // Prevent automatic upload, we'll handle it manually
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setFailedUploads([]);
    
    // Initialize progress tracking for each file
    const initialProgress: FileUploadProgress[] = fileList.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setUploadProgressList(initialProgress);

    try {
      const filesToUpload = fileList.map(file => file.originFileObj!);
      
      if (customUploadHandler) {
        // Use custom upload handler if provided
        const uploadedFiles = await customUploadHandler(filesToUpload);
        setFileList(uploadedFiles);
        onUploadComplete?.(uploadedFiles);
        message.success('Files uploaded successfully!');
      } else if (uploadType === 'epr-documents') {
        // Use real backend for EPR document uploads
        const client = eprClient();

        const uploadPromises = fileList.map(async (file, index) => {
          try {
            const origin = file.originFileObj!;
            const res = await client.uploadDocument(
              {
                file: origin as File,
                documentType: 'other',
                metadata: { originalName: file.name },
              },
              (p) => {
                setUploadProgressList(prev =>
                  prev.map((item, i) => (i === index ? { ...item, progress: p } : item))
                );
              }
            );

            setUploadProgressList(prev =>
              prev.map((item, i) => (i === index ? { ...item, progress: 100, status: 'success' } : item))
            );

            return {
              ...file,
              status: 'done' as const,
              response: { documentId: res.documentId, status: res.status },
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';

            setUploadProgressList(prev =>
              prev.map((item, i) => (i === index ? { ...item, status: 'error', error: errorMessage } : item))
            );
            setFailedUploads(prev => [...prev, file.uid]);
            onUploadError?.(errorMessage, file.name);

            return {
              ...file,
              status: 'error' as const,
              error: errorMessage,
            };
          }
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        setFileList(uploadedFiles);
        const successfulUploads = uploadedFiles.filter(file => file.status === 'done');
        const failedCount = uploadedFiles.length - successfulUploads.length;

        if (failedCount === 0) {
          message.success('All files uploaded successfully!');
          onUploadComplete?.(uploadedFiles);
        } else if (successfulUploads.length > 0) {
          message.warning(`${successfulUploads.length} files uploaded successfully, ${failedCount} failed`);
          onUploadComplete?.(successfulUploads);
        } else {
          message.error('All uploads failed');
        }
      } else {
        // Previous default simulated upload logic (kept for reference)
        // NOTE: This block simulates per-file progress and success; preserved as per request.
        // const uploadPromises = fileList.map(async (file, index) => {
        //   try {
        //     for (let progress = 0; progress <= 100; progress += Math.random() * 20) {
        //       await new Promise(resolve => setTimeout(resolve, 50));
        //       setUploadProgressList(prev => prev.map((item, i) => (i === index ? { ...item, progress: Math.min(progress, 100) } : item)));
        //     }
        //     await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        //     setUploadProgressList(prev => prev.map((item, i) => (i === index ? { ...item, progress: 100, status: 'success' } : item)));
        //     return { ...file, status: 'done' as const, response: { url: `https://example.com/uploads/${file.name}` } };
        //   } catch (error) {
        //     const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        //     setUploadProgressList(prev => prev.map((item, i) => (i === index ? { ...item, status: 'error', error: errorMessage } : item)));
        //     setFailedUploads(prev => [...prev, file.uid]);
        //     onUploadError?.(errorMessage, file.name);
        //     return { ...file, status: 'error' as const, error: errorMessage };
        //   }
        // });
        // const uploadedFiles = await Promise.all(uploadPromises);
        // setFileList(uploadedFiles);
        // const successfulUploads = uploadedFiles.filter(file => file.status === 'done');
        // const failedCount = uploadedFiles.length - successfulUploads.length;
        // if (failedCount === 0) {
        //   message.success('All files uploaded successfully!');
        //   onUploadComplete?.(uploadedFiles);
        // } else if (successfulUploads.length > 0) {
        //   message.warning(`${successfulUploads.length} files uploaded successfully, ${failedCount} failed`);
        //   onUploadComplete?.(successfulUploads);
        // } else {
        //   message.error('All uploads failed');
        // }

        // For non-EPR uploads, leave as no-op for now
        message.info('Upload handler not configured for this upload type.');
      }

      // Notify parent of progress updates
      onUploadProgress?.(uploadProgressList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      message.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid);
    handleFileChange(newFileList);
  };

  const handlePreview = (file: UploadFile) => {
    if (file.originFileObj) {
      const url = URL.createObjectURL(file.originFileObj);
      window.open(url, '_blank');
    }
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleBulkUpload = () => {
    if (bulkInputRef.current) {
      bulkInputRef.current.click();
    }
  };

  const handleCameraChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Add GPS coordinates if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const uploadFile: UploadFile = {
              uid: `camera-${Date.now()}`,
              name: `camera-capture-${Date.now()}.jpg`,
              status: 'done',
              originFileObj: file as any,
              size: file.size,
              type: file.type,
              // Store GPS data in file metadata
              response: {
                gps: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  timestamp: new Date().toISOString()
                }
              }
            };
            
            const newFileList = [...fileList, uploadFile];
            handleFileChange(newFileList);
            message.success('Image captured with GPS location');
          },
          (error) => {
            console.warn('GPS location not available:', error);
            const uploadFile: UploadFile = {
              uid: `camera-${Date.now()}`,
              name: `camera-capture-${Date.now()}.jpg`,
              status: 'done',
              originFileObj: file as any,
              size: file.size,
              type: file.type
            };
            
            const newFileList = [...fileList, uploadFile];
            handleFileChange(newFileList);
            message.info('Image captured (GPS not available)');
          }
        );
      } else {
        const uploadFile: UploadFile = {
          uid: `camera-${Date.now()}`,
          name: `camera-capture-${Date.now()}.jpg`,
          status: 'done',
          originFileObj: file as any,
          size: file.size,
          type: file.type
        };
        
        const newFileList = [...fileList, uploadFile];
        handleFileChange(newFileList);
        message.info('Image captured');
      }
    }
  };

  const handleBulkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const validFiles: UploadFile[] = [];
      const errors: string[] = [];

      fileArray.forEach((file, index) => {
        // Validate file size
        if (file.size / 1024 / 1024 > maxSize) {
          errors.push(`${file.name}: File too large (max ${maxSize}MB)`);
          return;
        }

        // Validate file type
        const isValidType = uploadType === 'waste-images' 
          ? file.type.startsWith('image/')
          : file.type.startsWith('image/') || file.type === 'application/pdf';
        
        if (!isValidType) {
          errors.push(`${file.name}: Invalid file type`);
          return;
        }

        // Check total file count
        if (fileList.length + validFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`);
          return;
        }

        validFiles.push({
          uid: `bulk-${Date.now()}-${index}`,
          name: file.name,
          status: 'done',
          originFileObj: file as any,
          size: file.size,
          type: file.type
        });
      });

      if (errors.length > 0) {
        message.error(`Some files were rejected: ${errors.join(', ')}`);
      }

      if (validFiles.length > 0) {
        const newFileList = [...fileList, ...validFiles];
        handleFileChange(newFileList);
        message.success(`${validFiles.length} files added successfully`);
      }
    }
  };

  const handleRetryUpload = async (file: UploadFile) => {
    if (!file.originFileObj) return;

    const fileIndex = fileList.findIndex(f => f.uid === file.uid);
    if (fileIndex === -1) return;

    // Reset file status
    const updatedFileList = [...fileList];
    updatedFileList[fileIndex] = { ...file, status: 'uploading' };
    setFileList(updatedFileList);

    // Remove from failed uploads
    setFailedUploads(prev => prev.filter(uid => uid !== file.uid));

    try {
      // Simulate retry upload
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      updatedFileList[fileIndex] = {
        ...file,
        status: 'done',
        response: { url: `https://example.com/uploads/${file.name}` }
      };
      
      setFileList([...updatedFileList]);
      message.success(`${file.name} uploaded successfully`);
    } catch (error) {
      updatedFileList[fileIndex] = { ...file, status: 'error' };
      setFileList([...updatedFileList]);
      setFailedUploads(prev => [...prev, file.uid]);
      message.error(`Failed to upload ${file.name}`);
    }
  };

  const getFileIcon = (file: UploadFile) => {
    if (file.status === 'uploading') {
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    } else if (file.status === 'done') {
      return file.type?.startsWith('image/') 
        ? <FileImageOutlined style={{ color: '#52c41a' }} />
        : <FilePdfOutlined style={{ color: '#52c41a' }} />;
    } else if (file.status === 'error') {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    
    if (file.type?.startsWith('image/')) {
      return <FileImageOutlined style={{ color: '#1890ff' }} />;
    } else if (file.type === 'application/pdf') {
      return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    }
    return <FileImageOutlined />;
  };

  const getFileProgress = (file: UploadFile) => {
    const progress = uploadProgressList.find(p => p.fileName === file.name);
    return progress?.progress || 0;
  };

  const getFileStatus = (file: UploadFile) => {
    if (file.status === 'uploading') return 'Uploading...';
    if (file.status === 'done') return 'Uploaded';
    if (file.status === 'error') return 'Failed';
    if (failedUploads.includes(file.uid)) return 'Failed';
    return 'Ready';
  };

  const getStatusColor = (file: UploadFile) => {
    if (file.status === 'uploading') return 'blue';
    if (file.status === 'done') return 'green';
    if (file.status === 'error' || failedUploads.includes(file.uid)) return 'red';
    return 'default';
  };

  const uploadProps: UploadProps = {
    multiple,
    fileList,
    beforeUpload,
    onRemove: handleRemove,
    onChange: ({ fileList: newFileList }) => {
      handleFileChange(newFileList);
    },
    onDrop: () => setDragActive(false),
    showUploadList: false,
    accept
  };

  return (
    <div className={`drag-drop-upload ${className}`}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>
              {uploadType === 'waste-images' ? 'Upload Waste Images' : 'Upload EPR Documents'}
            </Title>
            <Text type="secondary">
              {uploadType === 'waste-images' 
                ? 'Upload before and after images of waste collection'
                : 'Upload invoices, weighbridge slips, and other EPR documents'
              }
            </Text>
          </div>

          <Dragger 
            {...uploadProps}
            className={`upload-dragger ${dragActive ? 'drag-active' : ''}`}
            style={{ 
              border: dragActive ? '2px dashed #1890ff' : '2px dashed #d9d9d9',
              backgroundColor: dragActive ? '#f0f8ff' : '#fafafa'
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: dragActive ? '#1890ff' : '#d9d9d9' }} />
            </p>
            <p className="ant-upload-text">
              Click or drag files to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for single or bulk upload. Max {maxFiles} files, {maxSize}MB each.
              {uploadType === 'waste-images' ? ' Images only.' : ' Images and PDF files.'}
            </p>
          </Dragger>

          <Row gutter={16}>
            {enableCamera && uploadType === 'waste-images' && (
              <Col xs={24} sm={12}>
                <Button 
                  icon={<CameraOutlined />} 
                  onClick={handleCameraCapture}
                  type="dashed"
                  block
                  size="large"
                >
                  Capture from Camera
                </Button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleCameraChange}
                />
              </Col>
            )}
            
            {enableBulkUpload && (
              <Col xs={24} sm={enableCamera && uploadType === 'waste-images' ? 12 : 24}>
                <Button 
                  icon={<FolderOpenOutlined />} 
                  onClick={handleBulkUpload}
                  type="dashed"
                  block
                  size="large"
                >
                  Select Multiple Files
                </Button>
                <input
                  ref={bulkInputRef}
                  type="file"
                  accept={accept}
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleBulkChange}
                />
              </Col>
            )}
          </Row>

          {fileList.length > 0 && (
            <div>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Title level={5}>
                  Selected Files ({fileList.length}/{maxFiles})
                </Title>
                {failedUploads.length > 0 && (
                  <Badge count={failedUploads.length} offset={[10, 0]}>
                    <Tag color="red">Failed Uploads</Tag>
                  </Badge>
                )}
              </Space>
              
              <Row gutter={[16, 16]}>
                {fileList.map(file => {
                  const isUploading = file.status === 'uploading';
                  const isFailed = file.status === 'error' || failedUploads.includes(file.uid);
                  const progress = getFileProgress(file);
                  
                  return (
                    <Col xs={24} sm={12} md={8} key={file.uid}>
                      <Card 
                        size="small"
                        actions={[
                          <Tooltip title="Preview" key="preview">
                            <EyeOutlined onClick={() => handlePreview(file)} />
                          </Tooltip>,
                          ...(isFailed && enableRetry ? [
                            <Tooltip title="Retry Upload" key="retry">
                              <ReloadOutlined onClick={() => handleRetryUpload(file)} />
                            </Tooltip>
                          ] : []),
                          <Tooltip title="Remove" key="delete">
                            <DeleteOutlined onClick={() => handleRemove(file)} />
                          </Tooltip>
                        ]}
                        className={isFailed ? 'failed-upload' : ''}
                      >
                        <Card.Meta
                          avatar={getFileIcon(file)}
                          title={
                            <Text ellipsis style={{ width: 120 }}>
                              {file.name}
                            </Text>
                          }
                          description={
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                              </Text>
                              
                              {isUploading && (
                                <Progress 
                                  percent={Math.round(progress)} 
                                  size="small" 
                                  status="active"
                                  strokeColor="#1890ff"
                                />
                              )}
                              
                              <Tag color={getStatusColor(file)}>
                                {getFileStatus(file)}
                              </Tag>
                              
                              {file.response?.gps && (
                                <Tooltip title={`GPS: ${file.response.gps.latitude.toFixed(6)}, ${file.response.gps.longitude.toFixed(6)}`}>
                                  <Tag color="blue">GPS</Tag>
                                </Tooltip>
                              )}
                            </Space>
                          }
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}

          {uploading && (
            <Alert
              message="Uploading files..."
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  {uploadProgressList.map((progress) => (
                    <div key={progress.fileName}>
                      <Text style={{ fontSize: 12 }}>{progress.fileName}</Text>
                      <Progress 
                        percent={Math.round(progress.progress)} 
                        size="small"
                        status={progress.status === 'error' ? 'exception' : 'active'}
                        strokeColor={progress.status === 'success' ? '#52c41a' : '#1890ff'}
                      />
                    </div>
                  ))}
                </Space>
              }
              type="info"
              showIcon
              icon={<LoadingOutlined />}
            />
          )}

          {failedUploads.length > 0 && !uploading && (
            <Alert
              message={`${failedUploads.length} file(s) failed to upload`}
              description="You can retry failed uploads or remove them from the list."
              type="warning"
              showIcon
              closable
              onClose={() => setFailedUploads([])}
            />
          )}

          <Space>
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              onClick={handleUpload}
              loading={uploading}
              disabled={fileList.length === 0}
              size="large"
            >
              {uploading ? 'Uploading...' : `Upload ${fileList.length} file${fileList.length !== 1 ? 's' : ''}`}
            </Button>
            
            {failedUploads.length > 0 && enableRetry && (
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => {
                  const failedFiles = fileList.filter(f => failedUploads.includes(f.uid));
                  failedFiles.forEach(file => handleRetryUpload(file));
                }}
                disabled={uploading}
              >
                Retry Failed ({failedUploads.length})
              </Button>
            )}
            
            {fileList.length > 0 && (
              <Button 
                onClick={() => {
                  handleFileChange([]);
                  setFailedUploads([]);
                  setUploadProgressList([]);
                }}
                disabled={uploading}
              >
                Clear All
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      <style dangerouslySetInnerHTML={{
        __html: `
          .drag-drop-upload .upload-dragger {
            transition: all 0.3s ease;
          }
          
          .drag-drop-upload .drag-active {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
          }
          
          .drag-drop-upload .ant-upload-drag-icon {
            margin-bottom: 16px;
          }
          
          .drag-drop-upload .ant-card-actions {
            background: #fafafa;
          }
          
          .drag-drop-upload .ant-card-actions > li {
            margin: 4px 0;
          }
          
          .drag-drop-upload .ant-card-actions > li > span {
            color: #1890ff;
            cursor: pointer;
            transition: color 0.3s;
          }
          
          .drag-drop-upload .ant-card-actions > li > span:hover {
            color: #40a9ff;
          }
          
          .drag-drop-upload .failed-upload {
            border-color: #ff4d4f;
            background-color: #fff2f0;
          }
          
          .drag-drop-upload .failed-upload .ant-card-actions {
            background: #fff2f0;
          }
          
          .drag-drop-upload .ant-progress-line {
            margin: 4px 0;
          }
          
          .drag-drop-upload .ant-tag {
            margin: 2px 0;
          }
        `
      }} />
    </div>
  );
};

export default DragDropUpload;