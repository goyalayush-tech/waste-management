import React from 'react';
import { Card, Progress, Tag, Typography, Row, Col, Divider, List, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { WasteAnalysisResult } from '../../store/slices/wasteAnalysisSlice';

const { Title, Text } = Typography;

interface AnalysisResultsProps {
  analysis: WasteAnalysisResult;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#52c41a';
    if (confidence >= 0.7) return '#faad14';
    return '#f5222d';
  };
  
  const getConfidenceStatus = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'active';
    return 'exception';
  };
  
  return (
    <div className="analysis-results">
      {/* Main Classification */}
      <div className="classification-header">
        <div className="classification-info">
          <Title level={4} style={{ margin: 0 }}>
            {analysis.classification.replace(/_/g, ' ').toUpperCase()}
          </Title>
          <Text type="secondary">Primary Classification</Text>
        </div>
        <div className="confidence-indicator">
          <Progress
            type="circle"
            percent={Math.round(analysis.confidence * 100)}
            size={80}
            status={getConfidenceStatus(analysis.confidence)}
            strokeColor={getConfidenceColor(analysis.confidence)}
          />
          <Text strong style={{ display: 'block', textAlign: 'center', marginTop: '8px' }}>
            Confidence
          </Text>
        </div>
      </div>
      
      <Divider />
      
      {/* Key Metrics */}
      <Row gutter={16} className="metrics-grid">
        <Col span={8}>
          <Card size="small" className="metric-card">
            <div className="metric-content">
              <DollarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div className="metric-info">
                <Text strong>${analysis.valueEstimate.toFixed(2)}</Text>
                <Text type="secondary" style={{ display: 'block' }}>Estimated Value</Text>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card size="small" className="metric-card">
            <div className="metric-content">
              <EnvironmentOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              <div className="metric-info">
                <Text strong>{analysis.carbonFootprint.toFixed(2)} kg</Text>
                <Text type="secondary" style={{ display: 'block' }}>Carbon Footprint</Text>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card size="small" className="metric-card">
            <div className="metric-content">
              <CheckCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
              <div className="metric-info">
                <Text strong>{Math.round(analysis.qualityScore)}/100</Text>
                <Text type="secondary" style={{ display: 'block' }}>Quality Score</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      {/* Material Composition */}
      <div className="material-composition">
        <Title level={5}>Material Composition</Title>
        <div className="composition-bars">
          {Object.entries(analysis.materialComposition).map(([material, percentage]) => (
            <div key={material} className="composition-item">
              <div className="composition-label">
                <Text>{material.replace(/_/g, ' ')}</Text>
                <Text strong>{(percentage * 100).toFixed(1)}%</Text>
              </div>
              <Progress 
                percent={percentage * 100} 
                size="small" 
                showInfo={false}
                strokeColor="#1890ff"
              />
            </div>
          ))}
        </div>
      </div>
      
      <Divider />
      
      {/* Contamination Level */}
      <div className="contamination-section">
        <Title level={5}>
          <WarningOutlined style={{ marginRight: '8px' }} />
          Contamination Analysis
        </Title>
        <Progress
          percent={Math.round(analysis.contaminationLevel * 100)}
          status={analysis.contaminationLevel > 0.5 ? 'exception' : 'success'}
          strokeColor={analysis.contaminationLevel > 0.5 ? '#f5222d' : '#52c41a'}
        />
        <Text type="secondary">
          {analysis.contaminationLevel > 0.5 ? 'High contamination detected' : 'Low contamination level'}
        </Text>
      </div>
      
      <Divider />
      
      {/* Sensor Contributions */}
      <div className="sensor-contributions">
        <Title level={5}>
          <InfoCircleOutlined style={{ marginRight: '8px' }} />
          Sensor Contributions
        </Title>
        <Row gutter={8}>
          {Object.entries(analysis.sensorContributions).map(([sensor, contribution]) => (
            <Col span={6} key={sensor}>
              <Tooltip title={`${sensor} sensor contributed ${(contribution * 100).toFixed(1)}% to the analysis`}>
                <Tag color="blue" style={{ width: '100%', textAlign: 'center' }}>
                  {sensor}: {(contribution * 100).toFixed(0)}%
                </Tag>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </div>
      
      <Divider />
      
      {/* Processing Recommendations */}
      <div className="processing-recommendations">
        <Title level={5}>Processing Recommendations</Title>
        <List
          size="small"
          dataSource={analysis.processingRecommendations}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                title={`Step ${index + 1}`}
                description={item}
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default AnalysisResults;