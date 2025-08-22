import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Upload, 
  message, 
  Spin, 
  Tabs, 
  Tag, 
  Progress, 
  Divider, 
  Alert, 
  Space, 
  Typography, 
  Row, 
  Col 
} from 'antd';
import Card from '../../components/Shared/Card';
import Button from '../../components/Shared/Button';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';
import ErrorBoundary from '../../components/Shared/ErrorBoundary';
import { RESPONSIVE_CONFIGS } from '../../utils/responsive';
import '../shared-styles.css';
import { 
  UploadOutlined, 
  ScanOutlined, 
  WarningOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { RootState } from '../../store/store';
import { 
  detectContamination, 
  getRemediationActions, 
  flagBatch, 
  ContaminationType, 
  ContaminationSeverity 
} from '../../store/slices/contaminationSlice';
import ContaminationVisualizer from './ContaminationVisualizer';
import RemediationSuggestions from './RemediationSuggestions';
import FlaggedBatchesList from './FlaggedBatchesList';
import ContaminationStats from './ContaminationStats';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ContaminationDetection: React.FC = () => {
  const dispatch = useDispatch();
  const { currentResult, loading, error, flaggedBatches } = useSelector(
    (state: RootState) => state.contamination
  );
  
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('detection');
  const [batchId, setBatchId] = useState('');
  
  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
      setImagePreview(null);
    },
    beforeUpload: (file) => {
      if (!file.type.startsWith('image/')) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file as RcFile);
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      
      setFileList([file]);
      return false;
    },
    fileList,
    maxCount: 1,
  };
  
  const handleDetection = async () => {
    if (!imagePreview) {
      message.error('Please upload an image first');
      return;
    }
    
    try {
      await dispatch(detectContamination({
        imageData: imagePreview.split(',')[1], // Remove data URL prefix
        expectedMaterialType: 'mixed'
      }) as any);
      
      if (currentResult?.contaminationDetected) {
        dispatch(getRemediationActions(currentResult) as any);
      }
    } catch (err) {
      console.error('Error during contamination detection:', err);
    }
  };
  
  const handleFlagBatch = () => {
    if (!currentResult || !batchId) {
      message.error('Please enter a batch ID and perform detection first');
      return;
    }
    
    dispatch(flagBatch({
      batchId,
      contaminationResult: currentResult
    }) as any);
    
    message.success(`Batch ${batchId} has been flagged for contamination`);
    setBatchId('');
  };
  
  const getSeverityColor = (severity: ContaminationSeverity) => {
    switch (severity) {
      case ContaminationSeverity.NONE:
        return 'green';
      case ContaminationSeverity.LOW:
        return 'blue';
      case ContaminationSeverity.MEDIUM:
        return 'orange';
      case ContaminationSeverity.HIGH:
        return 'red';
      case ContaminationSeverity.CRITICAL:
        return 'purple';
      default:
        return 'default';
    }
  };
  
  const getSeverityText = (severity: ContaminationSeverity) => {
    switch (severity) {
      case ContaminationSeverity.NONE:
        return 'None';
      case ContaminationSeverity.LOW:
        return 'Low';
      case ContaminationSeverity.MEDIUM:
        return 'Medium';
      case ContaminationSeverity.HIGH:
        return 'High';
      case ContaminationSeverity.CRITICAL:
        return 'Critical';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <ErrorBoundary>
      <div className="contamination-detection-page tool-page">
      <Title level={2}>Advanced Contamination Detection System</Title>
      <Text type="secondary">
        Detect contamination in recyclable streams with 98%+ accuracy using multi-modal analysis
      </Text>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="tool-tabs">
        <TabPane tab="Detection" key="detection">
          <Row gutter={[24, 24]}>
            <Col {...RESPONSIVE_CONFIGS.content}>
              <Card title="Upload Waste Image" className="upload-card" variant="bordered">
                <Upload {...uploadProps} listType="picture">
                  <Button icon={<UploadOutlined />}>Select Image</Button>
                </Upload>
                
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', marginTop: 16 }} />
                  </div>
                )}
                
                <div className="action-section">
                  <div className="action-buttons">
                    <Button 
                      variant="primary" 
                      icon={<ScanOutlined />} 
                      onClick={handleDetection} 
                      loading={loading}
                      disabled={!imagePreview}
                    >
                      Detect Contamination
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col {...RESPONSIVE_CONFIGS.content}>
              <Card title="Detection Results" className="results-card" variant="bordered">
                {loading ? (
                  <LoadingSpinner 
                    size="large" 
                    text="Analyzing waste composition..."
                    style={{ minHeight: '200px' }}
                  />
                ) : error ? (
                  <Alert message="Error" description={error} type="error" showIcon />
                ) : currentResult ? (
                  <div className="detection-results">
                    <div className="result-header">
                      <Tag color={currentResult.contaminationDetected ? 'red' : 'green'} className="status-tag">
                        {currentResult.contaminationDetected ? 'Contamination Detected' : 'No Contamination'}
                      </Tag>
                      <div className="confidence-indicator">
                        <Text strong>Confidence: </Text>
                        <Progress 
                          percent={Math.round(currentResult.confidence * 100)} 
                          size="small" 
                          status={currentResult.confidence > 0.7 ? "success" : "active"} 
                        />
                      </div>
                    </div>
                    
                    {currentResult.contaminationDetected && (
                      <>
                        <Divider />
                        
                        <div className="contamination-details">
                          <div className="detail-item">
                            <span className="detail-label">Severity:</span>
                            <div className="detail-value">
                              <Tag color={getSeverityColor(currentResult.severityLevel)}>
                                {getSeverityText(currentResult.severityLevel)}
                              </Tag>
                            </div>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-label">Affected Area:</span>
                            <div className="detail-value">
                              <Progress 
                                percent={Math.round(currentResult.affectedAreaPercentage)} 
                                size="small" 
                                status={currentResult.affectedAreaPercentage > 50 ? "exception" : "active"} 
                              />
                            </div>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-label">Quality Degradation:</span>
                            <div className="detail-value">
                              <Progress 
                                percent={Math.round(currentResult.qualityDegradation * 100)} 
                                size="small" 
                                status={currentResult.qualityDegradation > 0.5 ? "exception" : "active"} 
                              />
                            </div>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-label">Economic Impact:</span>
                            <div className="detail-value">
                              <Text type="danger">${currentResult.economicImpact.toFixed(2)}</Text>
                            </div>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-label">Contamination Types:</span>
                            <div className="detail-value">
                              <div className="contamination-types">
                                {currentResult.contaminationTypes.map((type) => (
                                  <Tag key={type} color="blue">{type.replace(/_/g, ' ')}</Tag>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Divider />
                        
                        <div className="batch-flagging">
                          <Title level={5}>Flag Contaminated Batch</Title>
                          <Space>
                            <input 
                              type="text" 
                              placeholder="Enter Batch ID" 
                              value={batchId}
                              onChange={(e) => setBatchId(e.target.value)}
                              className="batch-input"
                            />
                            <Button 
                              variant="danger" 
                              icon={<WarningOutlined />} 
                              onClick={handleFlagBatch}
                            >
                              Flag Batch
                            </Button>
                          </Space>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="no-results">
                    <InfoCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    <Text>Upload an image and start detection to see results</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
          
          {currentResult?.contaminationDetected && (
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
              <Col {...RESPONSIVE_CONFIGS.content}>
                <ContaminationVisualizer 
                  imageUrl={imagePreview || ''} 
                  contaminationLocations={currentResult.contaminationLocations}
                />
              </Col>
              <Col {...RESPONSIVE_CONFIGS.content}>
                <RemediationSuggestions suggestions={currentResult.remediationSuggestions} />
              </Col>
            </Row>
          )}
        </TabPane>
        
        <TabPane tab={`Flagged Batches (${flaggedBatches.length})`} key="flagged">
          <FlaggedBatchesList />
        </TabPane>
        
        <TabPane tab="Statistics" key="statistics">
          <ContaminationStats />
        </TabPane>
      </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default ContaminationDetection;