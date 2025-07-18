import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Card, 
  Button, 
  Steps, 
  Progress, 
  Alert, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  Space,
  Modal,
  Upload,
  message
} from 'antd';
import { 
  SettingOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  CameraOutlined,
  ExperimentOutlined,
  ScaleOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import { RootState } from '../../store/store';
import { calibrateSensors, updateCalibrationStatus } from '../../store/slices/wasteAnalysisSlice';

const { Title, Text } = Typography;
const { Step } = Steps;

const SensorCalibration: React.FC = () => {
  const dispatch = useDispatch();
  const { calibrationStatus, loading } = useSelector((state: RootState) => state.wasteAnalysis);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [calibrationModal, setCalibrationModal] = useState(false);
  
  const sensorTypes = [
    {
      id: 'visual_1',
      name: 'Visual Sensor',
      icon: <CameraOutlined />,
      description: 'High-resolution camera for visual waste classification',
      status: calibrationStatus['visual_1'] || 'uncalibrated',
      calibrationSteps: [
        'Upload reference images',
        'Color calibration',
        'Lighting adjustment',
        'Distortion correction'
      ]
    },
    {
      id: 'spectral_1',
      name: 'Spectral Sensor',
      icon: <BgColorsOutlined />,
      description: 'NIR/FTIR spectrometer for material identification',
      status: calibrationStatus['spectral_1'] || 'uncalibrated',
      calibrationSteps: [
        'Wavelength calibration',
        'Intensity calibration',
        'Baseline correction',
        'Reference material scan'
      ]
    },
    {
      id: 'weight_1',
      name: 'Weight Sensor',
      icon: <ScaleOutlined />,
      description: 'Precision scale with density calculation',
      status: calibrationStatus['weight_1'] || 'uncalibrated',
      calibrationSteps: [
        'Zero calibration',
        'Reference weight calibration',
        'Linearity check',
        'Stability test'
      ]
    },
    {
      id: 'chemical_1',
      name: 'Chemical Sensor',
      icon: <ExperimentOutlined />,
      description: 'XRF analyzer for elemental composition',
      status: calibrationStatus['chemical_1'] || 'uncalibrated',
      calibrationSteps: [
        'Element detection calibration',
        'Compound identification setup',
        'Reference material analysis',
        'Accuracy verification'
      ]
    }
  ];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'calibrated':
        return 'green';
      case 'calibrating':
        return 'blue';
      case 'error':
        return 'red';
      default:
        return 'orange';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'calibrated':
        return <CheckCircleOutlined />;
      case 'error':
        return <ExclamationCircleOutlined />;
      default:
        return <SettingOutlined />;
    }
  };
  
  const handleCalibrateSensor = async (sensorId: string) => {
    setSelectedSensor(sensorId);
    setCalibrationModal(true);
    setCurrentStep(0);
    setCalibrationProgress(0);
    
    // Update status to calibrating
    dispatch(updateCalibrationStatus({ sensorId, status: 'calibrating' }));
    
    // Simulate calibration process
    const steps = sensorTypes.find(s => s.id === sensorId)?.calibrationSteps || [];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate step duration
      setCurrentStep(i + 1);
      setCalibrationProgress(((i + 1) / steps.length) * 100);
    }
    
    // Complete calibration
    dispatch(updateCalibrationStatus({ sensorId, status: 'calibrated' }));
    message.success(`${sensorTypes.find(s => s.id === sensorId)?.name} calibrated successfully!`);
    
    setTimeout(() => {
      setCalibrationModal(false);
      setSelectedSensor(null);
    }, 1000);
  };
  
  const handleCalibrateAll = async () => {
    try {
      await dispatch(calibrateSensors(sensorTypes.map(s => s.id)) as any);
      message.success('All sensors calibrated successfully!');
    } catch (error) {
      message.error('Failed to calibrate sensors');
    }
  };
  
  const selectedSensorData = sensorTypes.find(s => s.id === selectedSensor);
  
  return (
    <div className="sensor-calibration">
      <div className="calibration-header">
        <Title level={3}>Sensor Calibration</Title>
        <Text type="secondary">
          Calibrate sensors to ensure 98%+ accuracy in waste classification
        </Text>
      </div>
      
      <div className="calibration-actions" style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<SettingOutlined />} 
            onClick={handleCalibrateAll}
            loading={loading}
          >
            Calibrate All Sensors
          </Button>
          <Button>
            Load Calibration Profile
          </Button>
          <Button>
            Save Calibration Profile
          </Button>
        </Space>
      </div>
      
      <Row gutter={[16, 16]}>
        {sensorTypes.map((sensor) => (
          <Col span={12} key={sensor.id}>
            <Card
              title={
                <Space>
                  {sensor.icon}
                  {sensor.name}
                  <Tag color={getStatusColor(sensor.status)} icon={getStatusIcon(sensor.status)}>
                    {sensor.status.toUpperCase()}
                  </Tag>
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => handleCalibrateSensor(sensor.id)}
                  disabled={sensor.status === 'calibrating'}
                >
                  {sensor.status === 'calibrated' ? 'Recalibrate' : 'Calibrate'}
                </Button>
              }
              className="sensor-card"
            >
              <Text type="secondary">{sensor.description}</Text>
              
              <div className="calibration-steps" style={{ marginTop: '16px' }}>
                <Text strong>Calibration Steps:</Text>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {sensor.calibrationSteps.map((step, index) => (
                    <li key={index}>
                      <Text type="secondary">{step}</Text>
                    </li>
                  ))}
                </ul>
              </div>
              
              {sensor.status === 'calibrated' && (
                <Alert
                  message="Sensor Calibrated"
                  description="This sensor is properly calibrated and ready for analysis."
                  type="success"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              )}
              
              {sensor.status === 'error' && (
                <Alert
                  message="Calibration Error"
                  description="There was an error during calibration. Please try again."
                  type="error"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* Calibration Progress Modal */}
      <Modal
        title={`Calibrating ${selectedSensorData?.name}`}
        open={calibrationModal}
        footer={null}
        closable={false}
        width={600}
      >
        {selectedSensorData && (
          <div className="calibration-progress">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Progress
                type="circle"
                percent={Math.round(calibrationProgress)}
                size={120}
                status={calibrationProgress === 100 ? 'success' : 'active'}
              />
            </div>
            
            <Steps
              current={currentStep}
              direction="vertical"
              size="small"
            >
              {selectedSensorData.calibrationSteps.map((step, index) => (
                <Step
                  key={index}
                  title={step}
                  status={
                    index < currentStep ? 'finish' :
                    index === currentStep ? 'process' : 'wait'
                  }
                />
              ))}
            </Steps>
            
            {calibrationProgress === 100 && (
              <Alert
                message="Calibration Complete"
                description="Sensor has been successfully calibrated and is ready for use."
                type="success"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SensorCalibration;