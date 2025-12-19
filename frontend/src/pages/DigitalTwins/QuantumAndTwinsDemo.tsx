import React, { useState } from 'react';
import { Card, Button, Space, Input, Typography, List, message, Divider } from 'antd';
import { eprClient, quantumClient } from '@/services/api/apiClientFactory';

const { Title, Paragraph, Text } = Typography;

const QuantumAndTwinsDemo: React.FC = () => {
  const [twinId, setTwinId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<string>('A,B,C,D');
  const [routeResult, setRouteResult] = useState<any>(null);
  const [stateCounter, setStateCounter] = useState<number>(0);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [sensorId, setSensorId] = useState<string>('sensor-1');
  const [wasteId, setWasteId] = useState<string>('waste-001');
  const [tracking, setTracking] = useState<any>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  const onCreateTwin = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/digital-twins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: { name: 'Demo Twin' }, state: { parameters: {}, metrics: {} } })
      });
      const data = await res.json();
      setTwinId(data.twinId);
      message.success(`Twin created: ${data.twinId}`);
    } catch (e: any) {
      message.error(e.message || 'Failed to create twin');
    }
  };

  const onUpdateState = async () => {
    if (!twinId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/digital-twins/${twinId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: { parameters: { counter: stateCounter + 1 }, metrics: {} } })
      });
      await res.json();
      setStateCounter(c => c + 1);
      message.success('State updated');
    } catch (e: any) {
      message.error(e.message || 'Failed to update state');
    }
  };

  const onOptimizeRoute = async () => {
    try {
      const qc = quantumClient();
      const list = nodes.split(',').map(s => s.trim()).filter(Boolean);
      const result = await qc.optimizeRoute(list);
      setRouteResult(result);
    } catch (e: any) {
      message.error(e.message || 'Quantum optimize failed');
    }
  };

  const createLifecycle = async () => {
    if (!twinId) return;
    const res = await fetch(`${apiBase}/digital-twins/${twinId}/lifecycle-simulation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: 'default' })
    });
    const data = await res.json();
    setSimulationId(data.simulationId);
    message.success('Lifecycle created');
  };

  const startLifecycle = async () => {
    if (!twinId || !simulationId) return;
    await fetch(`${apiBase}/digital-twins/${twinId}/lifecycle-simulation/${simulationId}/start`, { method: 'POST' });
    message.success('Lifecycle started');
  };

  const stopLifecycle = async () => {
    if (!twinId || !simulationId) return;
    await fetch(`${apiBase}/digital-twins/${twinId}/lifecycle-simulation/${simulationId}/stop`, { method: 'POST' });
    message.success('Lifecycle stopped');
  };

  const getLifecycleResults = async () => {
    if (!twinId || !simulationId) return;
    const res = await fetch(`${apiBase}/digital-twins/${twinId}/lifecycle-simulation/${simulationId}/results`);
    const data = await res.json();
    message.info(`Efficiency: ${data.results?.efficiency}`);
  };

  const connectSensor = async () => {
    if (!twinId) return;
    await fetch(`${apiBase}/digital-twins/${twinId}/sensors`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sensorId, type: 'temperature' })
    });
    message.success('Sensor connected');
  };

  const pushSensorReading = async () => {
    if (!twinId) return;
    await fetch(`${apiBase}/digital-twins/${twinId}/sensors/${sensorId}/reading`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reading: { value: Math.round(20 + Math.random()*10) } })
    });
    message.success('Reading sent');
  };

  const sendAlert = async () => {
    if (!twinId) return;
    await fetch(`${apiBase}/digital-twins/${twinId}/alerts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'warning', message: 'High temperature' })
    });
    message.success('Alert added');
  };

  const startTracking = async () => {
    const res = await fetch(`${apiBase}/digital-twins/waste-tracking`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wasteId, twinChain: [twinId].filter(Boolean) })
    });
    const data = await res.json();
    setTracking(data);
  };

  const updateTracking = async () => {
    if (!twinId) return;
    const res = await fetch(`${apiBase}/digital-twins/waste-tracking/${wasteId}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ twinId, status: 'processing', metrics: { temp: 45 } })
    });
    const data = await res.json();
    setTracking(data);
  };

  const twinsOverview = async () => {
    const res = await fetch(`${apiBase}/digital-twins/ecosystem/overview`);
    const data = await res.json();
    message.info(`Twins: ${data.totalTwins}, Connections: ${data.connections}`);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={3}>Quantum & Digital Twins Demo</Title>

      <Card title="Digital Twin">
        <Space>
          <Button type="primary" onClick={onCreateTwin}>Create Twin</Button>
          <Button onClick={onUpdateState} disabled={!twinId}>Update State (+1)</Button>
          {twinId && <Text code>{twinId}</Text>}
        </Space>
      </Card>

      <Card title="Quantum Route Optimization">
        <Space direction="vertical" style={{ width: 400 }}>
          <Input value={nodes} onChange={e => setNodes(e.target.value)} placeholder="Comma-separated nodes" />
          <Button type="primary" onClick={onOptimizeRoute}>Optimize Route</Button>
          {routeResult && (
            <>
              <Paragraph>Method: <Text code>{routeResult.method}</Text></Paragraph>
              <Paragraph>Cost: <Text strong>{routeResult.cost}</Text></Paragraph>
              <List size="small" bordered dataSource={routeResult.route} renderItem={(n: string) => <List.Item>{n}</List.Item>} />
            </>
          )}
        </Space>
      </Card>

      <Divider />
      <Card title="Lifecycle Simulation">
        <Space>
          <Button onClick={createLifecycle} disabled={!twinId}>Create</Button>
          <Button onClick={startLifecycle} disabled={!simulationId}>Start</Button>
          <Button onClick={stopLifecycle} disabled={!simulationId}>Stop</Button>
          <Button onClick={getLifecycleResults} disabled={!simulationId}>Get Results</Button>
          {simulationId && <Text code>{simulationId}</Text>}
        </Space>
      </Card>

      <Card title="Sensors & Alerts">
        <Space>
          <Input value={sensorId} onChange={e => setSensorId(e.target.value)} style={{ width: 180 }} />
          <Button onClick={connectSensor} disabled={!twinId}>Connect Sensor</Button>
          <Button onClick={pushSensorReading} disabled={!twinId}>Send Reading</Button>
          <Button onClick={sendAlert} disabled={!twinId}>Add Alert</Button>
        </Space>
      </Card>

      <Card title="Waste Tracking">
        <Space direction="vertical" style={{ width: 400 }}>
          <Input value={wasteId} onChange={e => setWasteId(e.target.value)} />
          <Space>
            <Button onClick={startTracking}>Start</Button>
            <Button onClick={updateTracking} disabled={!twinId}>Update</Button>
            <Button onClick={twinsOverview}>Ecosystem Overview</Button>
          </Space>
          {tracking && (
            <>
              <Paragraph>Status: <Text strong>{tracking.status}</Text></Paragraph>
              <List size="small" bordered dataSource={tracking.history || []} renderItem={(h:any) => <List.Item>{h.status} @ {h.at}</List.Item>} />
            </>
          )}
        </Space>
      </Card>
    </Space>
  );
};

export default QuantumAndTwinsDemo; 