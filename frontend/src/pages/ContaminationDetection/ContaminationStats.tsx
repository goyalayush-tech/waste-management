import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Row, Col, Statistic, Typography, Table, Tag } from 'antd';
import { 
  WarningOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { RootState } from '../../store/store';
import { ContaminationType, ContaminationSeverity } from '../../store/slices/contaminationSlice';

const { Text } = Typography;

const ContaminationStats: React.FC = () => {
  const { detectionHistory, flaggedBatches } = useSelector((state: RootState) => state.contamination);
  
  // Calculate statistics
  const totalDetections = detectionHistory.length;
  const contaminatedDetections = detectionHistory.filter(result => result.contaminationDetected).length;
  const contaminationRate = totalDetections > 0 ? (contaminatedDetections / totalDetections) * 100 : 0;
  
  const remediatedBatches = flaggedBatches.filter(batch => batch.status === 'remediated').length;
  const pendingBatches = flaggedBatches.filter(batch => batch.status === 'pending').length;
  
  // Calculate contamination types distribution
  const contaminationTypesCount: Record<string, number> = {};
  detectionHistory.forEach(result => {
    if (result.contaminationDetected) {
      result.contaminationTypes.forEach(type => {
        contaminationTypesCount[type] = (contaminationTypesCount[type] || 0) + 1;
      });
    }
  });

  return (
    <div className="contamination-stats">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Detections"
              value={totalDetections}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Contamination Rate"
              value={contaminationRate.toFixed(1)}
              suffix="%"
              valueStyle={{ color: contaminationRate > 50 ? '#cf1322' : '#3f8600' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Remediated Batches"
              value={remediatedBatches}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Remediation"
              value={pendingBatches}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Card title="Contamination Types Distribution">
            <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', border: '1px dashed #d9d9d9' }}>
              <Text>Contamination Types Distribution Chart</Text>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Contamination Severity Distribution">
            <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', border: '1px dashed #d9d9d9' }}>
              <Text>Contamination Severity Distribution Chart</Text>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="Economic Impact Over Time">
            <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', border: '1px dashed #d9d9d9' }}>
              <Text>Economic Impact Over Time Chart</Text>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="Recent Contamination Summary">
            <Table
              dataSource={detectionHistory
                .filter(result => result.contaminationDetected)
                .slice(-10)
                .map((result, index) => ({
                  key: index,
                  id: `Detection ${index + 1}`,
                  types: result.contaminationTypes,
                  severity: result.severityLevel,
                  affectedArea: result.affectedAreaPercentage,
                  economicImpact: result.economicImpact
                }))
              }
              columns={[
                {
                  title: 'Detection ID',
                  dataIndex: 'id',
                  key: 'id',
                },
                {
                  title: 'Contamination Types',
                  dataIndex: 'types',
                  key: 'types',
                  render: (types: ContaminationType[]) => (
                    <>
                      {types.map((type) => (
                        <Tag color="blue" key={type}>
                          {type.toString().replace(/_/g, ' ')}
                        </Tag>
                      ))}
                    </>
                  ),
                },
                {
                  title: 'Severity',
                  dataIndex: 'severity',
                  key: 'severity',
                  render: (severity: ContaminationSeverity) => {
                    const severityText = ContaminationSeverity[severity];
                    const color = 
                      severity === ContaminationSeverity.NONE ? 'green' :
                      severity === ContaminationSeverity.LOW ? 'blue' :
                      severity === ContaminationSeverity.MEDIUM ? 'orange' :
                      severity === ContaminationSeverity.HIGH ? 'red' : 'purple';
                    
                    return <Tag color={color}>{severityText}</Tag>;
                  },
                },
                {
                  title: 'Affected Area',
                  dataIndex: 'affectedArea',
                  key: 'affectedArea',
                  render: (area: number) => `${area.toFixed(1)}%`,
                },
                {
                  title: 'Economic Impact',
                  dataIndex: 'economicImpact',
                  key: 'economicImpact',
                  render: (impact: number) => `$${impact.toFixed(2)}`,
                },
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ContaminationStats;