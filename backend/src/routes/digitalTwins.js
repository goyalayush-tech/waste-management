import express from 'express';
import { v4 as uuidv4 } from 'uuid';

// In-memory stores (replace with DB in production)
const twins = new Map();
const communications = [];
const connections = [];
const lifecycleSimulations = new Map(); // simulationId -> { twinId, config, status, results }
const wasteTracking = new Map(); // wasteId -> tracking record

const router = express.Router();

// Create a digital twin
router.post('/', (req, res) => {
  const twinId = uuidv4();
  const now = new Date().toISOString();
  const twin = {
    twinId,
    createdAt: now,
    updatedAt: now,
    metadata: req.body?.metadata || {},
    currentState: req.body?.state || { parameters: {}, metrics: {}, alerts: [] },
    historicalStates: [],
  };
  twins.set(twinId, twin);
  res.status(201).json({ twinId, ...twin });
});

// Get a digital twin
router.get('/:twinId', (req, res) => {
  const twin = twins.get(req.params.twinId);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json(twin);
});

// Update digital twin state
router.put('/:twinId/state', (req, res) => {
  const twin = twins.get(req.params.twinId);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  const now = new Date().toISOString();
  if (!twin.historicalStates) twin.historicalStates = [];
  if (twin.currentState) twin.historicalStates.push(twin.currentState);
  twin.currentState = { ...(req.body?.state || {}), timestamp: now };
  twin.updatedAt = now;
  twins.set(twin.twinId, twin);
  res.json(twin);
});

// Update digital twin metadata
router.put('/:twinId/metadata', (req, res) => {
  const twin = twins.get(req.params.twinId);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  twin.metadata = { ...twin.metadata, ...(req.body || {}) };
  twin.updatedAt = new Date().toISOString();
  twins.set(twin.twinId, twin);
  res.json(twin);
});

// Connect sensor to a twin
router.post('/:twinId/sensors', (req, res) => {
  const twin = twins.get(req.params.twinId);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  const sensor = { ...req.body, connectedAt: new Date().toISOString() };
  if (!twin.sensors) twin.sensors = [];
  twin.sensors.push(sensor);
  twin.updatedAt = new Date().toISOString();
  twins.set(twin.twinId, twin);
  res.status(201).json({ success: true, sensor });
});

// Update sensor reading
router.put('/:twinId/sensors/:sensorId/reading', (req, res) => {
  const twin = twins.get(req.params.twinId);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  if (!twin.sensorReadings) twin.sensorReadings = {};
  const reading = { ...(req.body?.reading || {}), timestamp: new Date().toISOString() };
  twin.sensorReadings[req.params.sensorId] = reading;
  twin.updatedAt = new Date().toISOString();
  twins.set(twin.twinId, twin);
  res.json({ success: true, reading });
});

// Create a connection between twins
router.post('/connections', (req, res) => {
  const { sourceTwinId, targetTwinId, connectionType, ...params } = req.body || {};
  if (!twins.get(sourceTwinId) || !twins.get(targetTwinId)) {
    return res.status(400).json({ error: 'Both source and target twins must exist' });
  }
  const connection = { id: uuidv4(), sourceTwinId, targetTwinId, connectionType, params, createdAt: new Date().toISOString() };
  connections.push(connection);
  res.status(201).json(connection);
});

// Synchronize twins
router.post('/sync', (req, res) => {
  const { twinIds } = req.body || {};
  const existing = (twinIds || []).filter(id => twins.has(id));
  res.json({ success: true, synced: existing.length, twinIds: existing });
});

// Run a simulation on a twin (generic)
router.post('/:twinId/simulate', (req, res) => {
  const twin = twins.get(req.params.twinId);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  const { simulationType, parameters } = req.body || {};
  const result = {
    simulationId: uuidv4(),
    simulationType,
    parameters,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    optimizedParameters: simulationType === 'optimization' ? { throughput: 1.05 } : undefined,
    metrics: { runtimeMs: Math.floor(200 + Math.random() * 800) }
  };
  res.status(200).json(result);
});

// Lifecycle simulation create/start/stop/results
router.post('/:twinId/lifecycle-simulation', (req, res) => {
  const twin = twins.get(req.params.twinId);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  const simulationId = req.body?.simulationId || uuidv4();
  const engine = {
    simulationId,
    twinId: req.params.twinId,
    config: req.body || {},
    status: 'initialized',
    results: null,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  lifecycleSimulations.set(simulationId, engine);
  res.status(201).json(engine);
});

router.post('/:twinId/lifecycle-simulation/:simulationId/start', (req, res) => {
  const engine = lifecycleSimulations.get(req.params.simulationId);
  if (!engine) return res.status(404).json({ error: 'Simulation not found' });
  engine.status = 'running';
  engine.lastUpdated = new Date().toISOString();
  res.json({ success: true, status: engine.status });
});

router.post('/:twinId/lifecycle-simulation/:simulationId/stop', (req, res) => {
  const engine = lifecycleSimulations.get(req.params.simulationId);
  if (!engine) return res.status(404).json({ error: 'Simulation not found' });
  engine.status = 'stopped';
  engine.lastUpdated = new Date().toISOString();
  res.json({ success: true, status: engine.status });
});

router.get('/:twinId/lifecycle-simulation/:simulationId/results', (req, res) => {
  const engine = lifecycleSimulations.get(req.params.simulationId);
  if (!engine) return res.status(404).json({ error: 'Simulation not found' });
  engine.results = engine.results || { summary: 'stub-results', efficiency: 0.9 + Math.random() * 0.1 };
  res.json({ success: true, results: engine.results });
});

// Communications (twin-to-twin messages)
router.post('/communications', (req, res) => {
  const msg = { id: uuidv4(), ...req.body, storedAt: new Date().toISOString() };
  communications.push(msg);
  res.status(201).json({ success: true, id: msg.id });
});

// Ecosystem overview
router.get('/ecosystem/overview', (_req, res) => {
  res.json({
    totalTwins: twins.size,
    connections: connections.length,
    simulations: lifecycleSimulations.size,
    messages: communications.length,
  });
});

// Waste transformation tracking
router.post('/waste-tracking', (req, res) => {
  const { wasteId, twinChain } = req.body || {};
  if (!wasteId || !Array.isArray(twinChain)) {
    return res.status(400).json({ error: 'wasteId and twinChain[] required' });
  }
  const record = { wasteId, twinChain, status: 'initiated', history: [{ status: 'initiated', at: new Date().toISOString() }] };
  wasteTracking.set(wasteId, record);
  res.status(201).json(record);
});

router.get('/waste-tracking/:wasteId', (req, res) => {
  const record = wasteTracking.get(req.params.wasteId);
  if (!record) return res.status(404).json({ error: 'Tracking not found' });
  res.json(record);
});

router.put('/waste-tracking/:wasteId/status', (req, res) => {
  const record = wasteTracking.get(req.params.wasteId);
  if (!record) return res.status(404).json({ error: 'Tracking not found' });
  const { twinId, status, metrics } = req.body || {};
  record.status = status || record.status;
  record.history.push({ twinId, status: record.status, metrics, at: new Date().toISOString() });
  wasteTracking.set(req.params.wasteId, record);
  res.json(record);
});

// Link twin to NFT
router.post('/:twinId/link-nft', (req, res) => {
  const twin = twins.get(req.params.twinId);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  const { tokenId, contractAddress } = req.body || {};
  twin.metadata = { ...twin.metadata, nftLink: { tokenId, contractAddress, linkedAt: new Date().toISOString() } };
  twins.set(twin.twinId, twin);
  res.json({ success: true, nftLink: twin.metadata.nftLink });
});

// Alerts
router.post('/:twinId/alerts', (req, res) => {
  const twin = twins.get(req.params.twinId);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  const alert = { ...req.body, alertId: uuidv4(), timestamp: new Date().toISOString() };
  if (!twin.currentState?.alerts) twin.currentState.alerts = [];
  twin.currentState.alerts.push(alert);
  twins.set(twin.twinId, twin);
  res.status(201).json({ success: true, alert });
});

// Train predictive model (stub)
router.post('/:twinId/train-model', (req, res) => {
  const { modelType, predictionType } = req.body || {};
  const model = { modelId: uuidv4(), modelType, predictionType, trainedAt: new Date().toISOString(), metrics: { accuracy: 0.9 } };
  res.json(model);
});

// Predict (stub)
router.post('/:twinId/predict', (req, res) => {
  const { timeHorizon = 10 } = req.body || {};
  const predictions = Array.from({ length: timeHorizon }).map((_, i) => ({ t: i, value: Math.round(50 + Math.random() * 50) }));
  res.json({ predictions, generatedAt: new Date().toISOString() });
});

export default router; 