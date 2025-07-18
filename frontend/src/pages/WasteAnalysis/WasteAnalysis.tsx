import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Card, 
  Button, 
  Upload, 
  message, 
  Spin, 
  Tabs, 
  Progress, 
  Row, 
  Col, 
  Statistic, 
  Alert, 
  Space, 
  Typography, 
  Tag,
  Divider
} from 'antd';
import { 
  UploadOutlined, 
  ScanOutlined, 
  SettingOutlined, 
  LineChartOutlined,
  ExperimentOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { RootState } from '../../store/store';
import { 
  analyzeWasteMultiModal, 
  calibrateSensors, 
  getRealTimeData,
  addSensorData
} from '../../store/slices/wasteAnalysisSlice';
import SensorCalibration from './SensorCalibration';
import AnalysisResults from './AnalysisResults';
import RealTimeMonitoring from './RealTimeMonitoring';
import AnalysisHistory from './AnalysisHistory';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const WasteAnalysis: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    currentAnalysis, 
    loading, 
    error, 
    calibrationStatus, 
    realTimeData,
    sensorData 
  } = useSelector((state: RootState) => state.wasteAnalysis);
  
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [analysisMode, setAnalysisMode] = useState<'single' | 'multi'>('single');
  
  useEffect(() => {
    // Fetch real-time data every 5 seconds
    const interval = setInterval(() => {
      dispatch(getRealTimeData() as any);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [dispatch]);
  
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
  
  const handleAnalysis = async () => {
    if (!imagePreview) {
      message.error('Please upload an image first');
      return;
    }
    
    try {
      await dispatch(analyzeWasteMultiModal({
        visualData: imagePreview.split(',')[1], // Remove data URL prefix
        // Add other sensor data if available
      }) as any);
      
      message.success('Analysis completed successfully!');
    } catch (err) {
      console.error('Error during analysis:', err);
    }
  };
  
  const handleCalibration = async () => {
    try {
      await dispatch(calibrateSensors(['visual_1', 'spectral_1', 'weight_1', 'chemical_1']) as any);
      message.success('Sensor calibration completed!');
    } catch (err) {
      console.error('Error during calibration:', err);
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#52c41a';
    if (confidence >= 0.7) return '#faad14';
    return '#f5222d';
  };
  
  return (
    <div className="waste-analysis-page">
      <div className="page-header">
        <Title level={2}>Multi-Modal Waste Analysis System</Title>
        <Text type="secondary">
          Advanced AI-powered waste classification with 98%+ accuracy using sensor fusion
        </Text>
      </div>
      
      {/* Real-time metrics */}
      <Row gutter={16} className="metrics-row" style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="System Efficiency"
              value={realTimeData.efficiency}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Throughput"
              value={realTimeData.throughput}
              suffix="items/hr"
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Quality Score"
              value={realTimeData.qualityScore}
              suffix="/100"
              valueStyle={{ color: getConfidenceColor(realTimeData.qualityScore / 100) }}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Energy Usage"
              value={realTimeData.energyConsumption}
              suffix="kWh"
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="analysis-tabs">
        <TabPane tab="Analysis" key="analysis">
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Upload Waste Sample" className="upload-card">
                <div className="analysis-mode-selector" style={{ marginBottom: '16px' }}>
                  <Space>
                    <Text strong>Analysis Mode:</Text>
                    <Button 
                      type={analysisMode === 'single' ? 'primary' : 'default'}
                      onClick={() => setAnalysisMode('single')}
                    >
                      Single Modal
                    </Button>
                    <Button 
                      type={analysisMode === 'multi' ? 'primary' : 'default'}
                      onClick={() => setAnalysisMode('multi')}
                    >
                      Multi-Modal
                    </Button>
                  </Space>
                </div>
                
                <Upload {...uploadProps} listType="picture">
                  <Button icon={<UploadOutlined />}>Select Image</Button>
                </Upload>
                
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', marginTop: 16 }} />
                  </div>
                )}
                
                <div className="analysis-actions" style={{ marginTop: 16 }}>
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<ScanOutlined />} 
                      onClick={handleAnalysis} 
                      loading={loading}
                      disabled={!imagePreview}
                    >
                      Analyze Waste
                    </Button>
                    <Button 
                      icon={<SettingOutlined />} 
                      onClick={handleCalibration}
                    >
                      Calibrate Sensors
                    </Button>
                  </Space>
                </div>
                
                {/* Calibration Status */}
                <div className="calibration-status" style={{ marginTop: '16px' }}>
                  <Text strong>Sensor Status:</Text>
                  <div style={{ marginTop: '8px' }}>
                    {Object.entries(calibrationStatus).map(([sensorId, status]) => (
                      <Tag 
                        key={sensorId} 
                        color={status === 'calibrated' ? 'green' : 'orange'}
                        style={{ marginBottom: '4px' }}
                      >
                        {sensorId}: {status}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="Analysis Results" className="results-card">
                {loading ? (
                  <div className="loading-container" style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px' }}>
                      <Text>Processing multi-modal sensor data...</Text>
                      <Progress percent={75} size="small" style={{ marginTop: '8px' }} />
                    </div>
                  </div>
                ) : error ? (
                  <Alert message="Analysis Error" description={error} type="error" showIcon />
                ) : currentAnalysis ? (
                  <AnalysisResults analysis={currentAnalysis} />
                ) : (
                  <div className="no-results" style={{ textAlign: 'center', padding: '40px' }}>
                    <ExperimentOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    <div style={{ marginTop: '16px' }}>
                      <Text>Upload a waste sample and start analysis</Text>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="Real-time Monitoring" key="monitoring">
          <RealTimeMonitoring />
        </TabPane>
        
        <TabPane tab="Sensor Calibration" key="calibration">
          <SensorCalibration />
        </TabPane>
        
        <TabPane tab="Analysis History" key="history">
          <AnalysisHistory />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default WasteAnalysis;