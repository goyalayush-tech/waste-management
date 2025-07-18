import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Row, Col, Statistic, Progress, Typography, Table, Tag } from 'antd';
import { 
  WarningOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { RootState } from '../../store/store';
import { ContaminationType, ContaminationSeverity } from '../../store/slices/contaminationSlice';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

const { Title, Text } = Typography;

const ContaminationStats: React.FC = () => {
  const { detectionHistory, flaggedBatches } = useSelector((state: RootState) => state.contamination);
  
  // Calculate statistics
  const totalDetections = detectionHistory.length;
  const contaminatedDetections = detectionHistory.filter(result => result.contaminationDetected).length;
  const contaminationRate = totalDetections > 0 ? (contaminatedDetections / totalDetections) * 100 : 0;
  
  const remediatedBatches = flaggedBatches.filter(batch => batch.status === 'remediated').length;
  const pendingBatches = flaggedBatches.filter(batch => batch.status === 'pending').length;
  const rejectedBatches = flaggedBatches.filter(batch => batch.status === 'rejected').length;
  
  // Calculate contamination types distribution
  const contaminationTypesCount: Record<string, number> = {};
  detectionHistory.forEach(result => {
    if (result.contaminationDetected) {
      result.contaminationTypes.forEach(type => {
        contaminationTypesCount[type] = (contaminationTypesCount[type] || 0) + 1;
      });
    }
  });
  
  const contaminationTypesData = Object.entries(contaminationTypesCount).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count
  }));
  
  // Calculate severity distribution
  const severityCount: Record<string, number> = {
    'None': 0,
    'Low': 0,
    'Medium': 0,
    'High': 0,
    'Critical': 0
  };
  
  detectionHistory.forEach(result => {
    if (result.contaminationDetected) {
      switch (result.severityLevel) {
        case ContaminationSeverity.NONE:
          severityCount['None']++;
          break;
        case ContaminationSeverity.LOW:
          severityCount['Low']++;
          break;
        case ContaminationSeverity.MEDIUM:
          severityCount['Medium']++;
          break;
        case ContaminationSeverity.HIGH:
          severityCount['High']++;
          break;
        case ContaminationSeverity.CRITICAL:
          severityCount['Critical']++;
          break;
      }
    }
  });
  
  const severityData = Object.entries(severityCount).map(([severity, count]) => ({
    name: severity,
    value: count
  }));
  
  // Economic impact over time
  const economicImpactData = detectionHistory
    .filter(result => result.contaminationDetected)
    .map((result, index) => ({
      name: `Detection ${index + 1}`,
      impact: result.economicImpact
    }));
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const SEVERITY_COLORS = {
    'None': '#52c41a',
    'Low': '#1890ff',
    'Medium': '#faad14',
    'High': '#f5222d',
    'Critical': '#722ed1'
  };
  
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contaminationTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {contaminationTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} detections`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Contamination Severity Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {severityData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} detections`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="Economic Impact Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={economicImpactData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Economic Impact']} />
                <Legend />
                <Bar dataKey="impact" fill="#8884d8" name="Economic Impact ($)" />
              </BarChart>
            </ResponsiveContainer>
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