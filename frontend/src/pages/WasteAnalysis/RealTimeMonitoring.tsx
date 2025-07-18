import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Row, Col, Statistic, Progress, Typography, Alert, Switch, Button } from 'antd';
import { 
  LineChartOutlined, 
  ThunderboltOutlined, 
  ExperimentOutlined, 
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { RootState } from '../../store/store';
import { getRealTimeData, addSensorData } from '../../store/slices/wasteAnalysisSlice';

const { Title, Text } = Typography;

const RealTimeMonitoring: React.FC = () => {
  const dispatch = useDispatch();
  const { realTimeData, sensorData } = useSelector((state: RootState) => state.wasteAnalysis);
  
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [sensorChartData, setSensorChartData] = useState<any[]>([]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      interval = setInterval(() => {
        dispatch(getRealTimeData() as any);
        
        // Simulate sensor data
        const timestamp = new Date().toLocaleTimeString();
        const newDataPoint = {
          time: timestamp,
          efficiency: realTimeData.efficiency + (Math.random() - 0.5) * 5,
          throughput: realTimeData.throughput + (Math.random() - 0.5) * 10,
          qualityScore: realTimeData.qualityScore + (Math.random() - 0.5) * 3,
          energyConsumption: realTimeData.energyConsumption + (Math.random() - 0.5) * 2
        };
        
        setChartData(prev => {
          const updated = [...prev, newDataPoint];
          return updated.slice(-20); // Keep last 20 data points
        });
        
        // Simulate individual sensor readings
        const sensorReading = {
          time: timestamp,
          visual: Math.random() * 100,
          spectral: Math.random() * 100,
          weight: Math.random() * 100,
          chemical: Math.random() * 100
        };
        
        setSensorChartData(prev => {
          const updated = [...prev, sensorReading];
          return updated.slice(-20);
        });
        
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, dispatch, realTimeData]);
  
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return '#52c41a';
    if (value >= thresholds.warning) return '#faad14';
    return '#f5222d';
  };
  
  return (
    <div className="real-time-monitoring">
      <div className="monitoring-header">
        <Title level={3}>Real-Time System Monitoring</Title>
        <div className="monitoring-controls">
          <Switch
            checked={isMonitoring}
            onChange={setIsMonitoring}
            checkedChildren={<PlayCircleOutlined />}
            unCheckedChildren={<PauseCircleOutlined />}
          />
          <Text style={{ marginLeft: '8px' }}>
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
          </Text>
        </div>
      </div>
      
      {/* Key Metrics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="System Efficiency"
              value={realTimeData.efficiency}
              suffix="%"
              valueStyle={{ color: getStatusColor(realTimeData.efficiency, { good: 85, warning: 70 }) }}
              prefix={<ThunderboltOutlined />}
            />
            <Progress 
              percent={realTimeData.efficiency} 
              size="small" 
              strokeColor={getStatusColor(realTimeData.efficiency, { good: 85, warning: 70 })}
              showInfo={false}
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
            <Progress 
              percent={Math.min(realTimeData.throughput / 10, 100)} 
              size="small" 
              showInfo={false}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Quality Score"
              value={realTimeData.qualityScore}
              suffix="/100"
              valueStyle={{ color: getStatusColor(realTimeData.qualityScore, { good: 90, warning: 75 }) }}
              prefix={<ExperimentOutlined />}
            />
            <Progress 
              percent={realTimeData.qualityScore} 
              size="small" 
              strokeColor={getStatusColor(realTimeData.qualityScore, { good: 90, warning: 75 })}
              showInfo={false}
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
            <Progress 
              percent={Math.min(realTimeData.energyConsumption * 10, 100)} 
              size="small" 
              showInfo={false}
            />
          </Card>
        </Col>
      </Row>
      
      {/* System Performance Chart */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="System Performance Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#52c41a" 
                  strokeWidth={2}
                  name="Efficiency (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="throughput" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="Throughput (items/hr)"
                />
                <Line 
                  type="monotone" 
                  dataKey="qualityScore" 
                  stroke="#faad14" 
                  strokeWidth={2}
                  name="Quality Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      
      {/* Sensor Readings */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Individual Sensor Readings">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={sensorChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="visual" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8"
                  name="Visual Sensor"
                />
                <Area 
                  type="monotone" 
                  dataKey="spectral" 
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d"
                  name="Spectral Sensor"
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stackId="1" 
                  stroke="#ffc658" 
                  fill="#ffc658"
                  name="Weight Sensor"
                />
                <Area 
                  type="monotone" 
                  dataKey="chemical" 
                  stackId="1" 
                  stroke="#ff7300" 
                  fill="#ff7300"
                  name="Chemical Sensor"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      
      {/* System Alerts */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="System Alerts">
            {realTimeData.efficiency < 70 && (
              <Alert
                message="Low System Efficiency"
                description="System efficiency has dropped below 70%. Consider maintenance."
                type="warning"
                showIcon
                style={{ marginBottom: '8px' }}
              />
            )}
            
            {realTimeData.qualityScore < 75 && (
              <Alert
                message="Quality Score Alert"
                description="Quality score is below acceptable threshold. Check sensor calibration."
                type="error"
                showIcon
                style={{ marginBottom: '8px' }}
              />
            )}
            
            {realTimeData.energyConsumption > 15 && (
              <Alert
                message="High Energy Consumption"
                description="Energy usage is higher than normal. Optimize processing parameters."
                type="info"
                showIcon
                style={{ marginBottom: '8px' }}
              />
            )}
            
            {realTimeData.efficiency >= 85 && realTimeData.qualityScore >= 90 && (
              <Alert
                message="System Operating Optimally"
                description="All systems are functioning within optimal parameters."
                type="success"
                showIcon
              />
            )}
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Quick Actions">
            <div className="quick-actions">
              <Button type="primary" block style={{ marginBottom: '8px' }}>
                Optimize Processing Parameters
              </Button>
              <Button block style={{ marginBottom: '8px' }}>
                Recalibrate Sensors
              </Button>
              <Button block style={{ marginBottom: '8px' }}>
                Generate Performance Report
              </Button>
              <Button danger block>
                Emergency Stop
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RealTimeMonitoring;