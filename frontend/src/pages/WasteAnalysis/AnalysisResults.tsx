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
import styles from './AnalysisResults.module.css';

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
    <div className={styles.analysisResults}>
      {/* Main Classification */}
      <div className={styles.classificationHeader}>
        <div className={styles.classificationInfo}>
          <Title level={4} className={styles.classificationTitle}>
            {analysis.classification.replace(/_/g, ' ').toUpperCase()}
          </Title>
          <Text type="secondary">Primary Classification</Text>
        </div>
        <div className={styles.confidenceIndicator}>
          <Progress
            type="circle"
            percent={Math.round(analysis.confidence * 100)}
            size={80}
            status={getConfidenceStatus(analysis.confidence)}
            strokeColor={getConfidenceColor(analysis.confidence)}
          />
          <Text strong className={styles.confidenceLabel}>
            Confidence
          </Text>
        </div>
      </div>
      
      <Divider />
      
      {/* Key Metrics */}
      <Row gutter={16} className={styles.metricsGrid}>
        <Col span={8}>
          <Card size="small" className={styles.metricCard}>
            <div className={styles.metricContent}>
              <DollarOutlined className={styles.metricIconBlue} />
              <div className={styles.metricInfo}>
                <Text strong>${analysis.valueEstimate.toFixed(2)}</Text>
                <Text type="secondary" className={styles.metricLabel}>Estimated Value</Text>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card size="small" className={styles.metricCard}>
            <div className={styles.metricContent}>
              <EnvironmentOutlined className={styles.metricIconGreen} />
              <div className={styles.metricInfo}>
                <Text strong>{analysis.carbonFootprint.toFixed(2)} kg</Text>
                <Text type="secondary" className={styles.metricLabel}>Carbon Footprint</Text>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card size="small" className={styles.metricCard}>
            <div className={styles.metricContent}>
              <CheckCircleOutlined className={styles.metricIconOrange} />
              <div className={styles.metricInfo}>
                <Text strong>{Math.round(analysis.qualityScore)}/100</Text>
                <Text type="secondary" className={styles.metricLabel}>Quality Score</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      {/* Material Composition */}
      <div className={styles.materialComposition}>
        <Title level={5}>Material Composition</Title>
        <div className={styles.compositionBars}>
          {Object.entries(analysis.materialComposition).map(([material, percentage]) => (
            <div key={material} className={styles.compositionItem}>
              <div className={styles.compositionLabel}>
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
      <div className={styles.contaminationSection}>
        <Title level={5}>
          <WarningOutlined className={styles.titleIcon} />
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
      <div className={styles.sensorContributions}>
        <Title level={5}>
          <InfoCircleOutlined className={styles.titleIcon} />
          Sensor Contributions
        </Title>
        <Row gutter={8}>
          {Object.entries(analysis.sensorContributions).map(([sensor, contribution]) => (
            <Col span={6} key={sensor}>
              <Tooltip title={`${sensor} sensor contributed ${(contribution * 100).toFixed(1)}% to the analysis`}>
                <Tag color="blue" className={styles.sensorTag}>
                  {sensor}: {(contribution * 100).toFixed(0)}%
                </Tag>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </div>
      
      <Divider />
      
      {/* Processing Recommendations */}
      <div className={styles.processingRecommendations}>
        <Title level={5}>Processing Recommendations</Title>
        <List
          size="small"
          dataSource={analysis.processingRecommendations}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={<CheckCircleOutlined className={styles.recommendationIcon} />}
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