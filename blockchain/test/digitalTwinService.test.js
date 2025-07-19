const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const WebSocket = require('ws');
const digitalTwinService = require('../services/digitalTwinService');
const ipfsService = require('../services/ipfsService');

describe('Digital Twin Service', function() {
  let axiosPostStub;
  let axiosGetStub;
  let axiosPutStub;
  let ipfsStoreMetadataStub;
  let wsStub;
  
  beforeEach(function() {
    // Stub axios methods
    axiosPostStub = sinon.stub(axios, 'post');
    axiosGetStub = sinon.stub(axios, 'get');
    axiosPutStub = sinon.stub(axios, 'put');
    
    // Stub IPFS service
    ipfsStoreMetadataStub = sinon.stub(ipfsService, 'storeMetadata');
    
    // Stub WebSocket
    wsStub = sinon.stub(WebSocket.prototype, 'send');
  });
  
  afterEach(function() {
    // Restore stubs
    axiosPostStub.restore();
    axiosGetStub.restore();
    axiosPutStub.restore();
    ipfsStoreMetadataStub.restore();
    wsStub.restore();
  });
  
  describe('Digital Twin Creation', function() {
    it('should create a digital twin and store metadata on IPFS', async function() {
      // Mock responses
      const twinId = 'twin-123';
      const cid = 'Qm123456789';
      
      axiosPostStub.resolves({ data: { twinId } });
      ipfsStoreMetadataStub.resolves(cid);
      axiosPutStub.resolves({ data: { twinId, ipfsCid: cid } });
      
      // Test data
      const twinData = {
        physicalAssetId: 'asset-123',
        name: 'Waste Processing Unit 1',
        type: 'equipment',
        initialState: {
          parameters: {
            temperature: 25,
            pressure: 1.0,
            flowRate: 100
          },
          metrics: {
            efficiency: 0.85,
            throughput: 500,
            energyConsumption: 1200,
            qualityScore: 0.92,
            environmentalImpact: 0.3
          },
          status: 'normal'
        }
      };
      
      // Execute
      const result = await digitalTwinService.createDigitalTwin(twinData);
      
      // Verify
      expect(result).to.have.property('twinId', twinId);
      expect(axiosPostStub.calledOnce).to.be.true;
      expect(ipfsStoreMetadataStub.calledOnce).to.be.true;
      expect(axiosPutStub.calledOnce).to.be.true;
      
      // Verify IPFS metadata includes twin data
      const ipfsCallArg = ipfsStoreMetadataStub.firstCall.args[0];
      expect(ipfsCallArg).to.have.property('type', 'digital-twin');
      expect(ipfsCallArg).to.have.property('twinId', twinId);
      expect(ipfsCallArg).to.have.property('physicalAssetId', twinData.physicalAssetId);
    });
  });
  
  describe('Digital Twin State Management', function() {
    it('should update digital twin state', async function() {
      // Mock response
      const twinId = 'twin-123';
      axiosPutStub.resolves({ data: { twinId, status: 'updated' } });
      
      // Test data
      const newState = {
        parameters: {
          temperature: 30,
          pressure: 1.2
        },
        metrics: {
          efficiency: 0.9,
          throughput: 550
        },
        status: 'normal'
      };
      
      // Execute
      const result = await digitalTwinService.updateTwinState(twinId, newState);
      
      // Verify
      expect(result).to.have.property('status', 'updated');
      expect(axiosPutStub.calledOnce).to.be.true;
      
      // Verify correct endpoint and payload
      const [url, payload] = axiosPutStub.firstCall.args;
      expect(url).to.include(`/${twinId}/state`);
      expect(payload).to.have.property('state');
      expect(payload.state).to.deep.equal(newState);
    });
    
    it('should handle WebSocket state updates', function() {
      // Setup test data
      const twinId = 'twin-123';
      const state = {
        parameters: { temperature: 35 },
        metrics: { efficiency: 0.95 }
      };
      
      // Create a mock twin in the service's active twins map
      digitalTwinService.activeTwins.set(twinId, {
        currentState: {
          parameters: { temperature: 30 },
          metrics: { efficiency: 0.9 }
        },
        historicalStates: []
      });
      
      // Simulate WebSocket message
      digitalTwinService.handleTwinStateUpdate({ twinId, state });
      
      // Verify state was updated
      const updatedTwin = digitalTwinService.activeTwins.get(twinId);
      expect(updatedTwin.currentState.parameters.temperature).to.equal(35);
      expect(updatedTwin.currentState.metrics.efficiency).to.equal(0.95);
      expect(updatedTwin.historicalStates).to.have.lengthOf(1);
    });
  });
  
  describe('Twin-to-Twin Communication', function() {
    it('should send messages between twins', async function() {
      // Mock response
      const communicationId = 'comm-123';
      axiosPostStub.resolves({ data: { communicationId, status: 'sent' } });
      
      // Test data
      const sourceTwinId = 'twin-source';
      const targetTwinId = 'twin-target';
      const messageType = 'state_sync';
      const payload = {
        parameters: { temperature: 35 }
      };
      
      // Execute
      const result = await digitalTwinService.sendTwinToTwinMessage(
        sourceTwinId, targetTwinId, messageType, payload
      );
      
      // Verify
      expect(result).to.have.property('status', 'sent');
      expect(axiosPostStub.calledOnce).to.be.true;
      
      // Verify WebSocket message was sent
      expect(wsStub.calledOnce).to.be.true;
      const wsMessage = JSON.parse(wsStub.firstCall.args[0]);
      expect(wsMessage.type).to.equal('twin_to_twin_message');
      expect(wsMessage.data.sourceTwinId).to.equal(sourceTwinId);
      expect(wsMessage.data.targetTwinId).to.equal(targetTwinId);
      expect(wsMessage.data.messageType).to.equal(messageType);
    });
    
    it('should process state sync messages between twins', function() {
      // Setup test data
      const sourceTwinId = 'twin-source';
      const targetTwinId = 'twin-target';
      const payload = {
        parameters: { temperature: 35 },
        metrics: { efficiency: 0.95 }
      };
      
      // Create a mock target twin
      digitalTwinService.activeTwins.set(targetTwinId, {
        currentState: {
          parameters: { temperature: 30, pressure: 1.2 },
          metrics: { efficiency: 0.9, throughput: 550 }
        }
      });
      
      // Stub the updateTwinState method to prevent actual API calls
      const updateTwinStateStub = sinon.stub(digitalTwinService, 'updateTwinState').resolves({});
      
      // Simulate processing a state sync message
      digitalTwinService.processTwinStateSync(sourceTwinId, targetTwinId, payload);
      
      // Verify state was updated correctly
      const updatedTwin = digitalTwinService.activeTwins.get(targetTwinId);
      expect(updatedTwin.currentState.parameters.temperature).to.equal(35);
      expect(updatedTwin.currentState.parameters.pressure).to.equal(1.2); // Unchanged
      expect(updatedTwin.currentState.metrics.efficiency).to.equal(0.95);
      expect(updatedTwin.currentState.metrics.throughput).to.equal(550); // Unchanged
      
      // Verify updateTwinState was called
      expect(updateTwinStateStub.calledOnce).to.be.true;
      
      // Restore stub
      updateTwinStateStub.restore();
    });
  });
  
  describe('Lifecycle Simulation', function() {
    it('should create and manage lifecycle simulations', async function() {
      // Mock responses
      const twinId = 'twin-123';
      const simulationId = 'sim-123';
      axiosPostStub.resolves({ data: { simulationId, status: 'initialized' } });
      
      // Test data
      const simulationConfig = {
        duration: 30,
        timeStep: 0.5,
        parameters: {
          initialTemperature: 25,
          ambientTemperature: 20
        }
      };
      
      // Execute
      const result = await digitalTwinService.createLifecycleSimulation(twinId, simulationConfig);
      
      // Verify
      expect(result).to.have.property('simulationId');
      expect(axiosPostStub.calledOnce).to.be.true;
      
      // Verify simulation engine was stored
      const engine = digitalTwinService.simulationEngines.get(result.simulationId);
      expect(engine).to.exist;
      expect(engine.twinId).to.equal(twinId);
      expect(engine.status).to.equal('initialized');
    });
    
    it('should start, stop and get results from simulations', async function() {
      // Setup
      const twinId = 'twin-123';
      const simulationId = 'sim-123';
      
      // Store a mock simulation engine
      digitalTwinService.simulationEngines.set(simulationId, {
        twinId,
        status: 'initialized',
        config: { duration: 30 },
        results: null,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      
      // Mock responses
      axiosPostStub.onFirstCall().resolves({ data: { simulationId, status: 'running' } });
      axiosPostStub.onSecondCall().resolves({ data: { simulationId, status: 'stopped' } });
      axiosGetStub.resolves({ 
        data: { 
          results: {
            finalTemperature: 35,
            energyConsumed: 1500
          }
        }
      });
      
      // Start simulation
      await digitalTwinService.startLifecycleSimulation(simulationId);
      let engine = digitalTwinService.simulationEngines.get(simulationId);
      expect(engine.status).to.equal('running');
      
      // Stop simulation
      await digitalTwinService.stopLifecycleSimulation(simulationId);
      engine = digitalTwinService.simulationEngines.get(simulationId);
      expect(engine.status).to.equal('stopped');
      
      // Get results
      const results = await digitalTwinService.getLifecycleSimulationResults(simulationId);
      expect(results).to.have.nested.property('results.finalTemperature', 35);
      
      // Verify engine was updated with results
      engine = digitalTwinService.simulationEngines.get(simulationId);
      expect(engine.results).to.have.property('finalTemperature', 35);
    });
  });
  
  describe('Waste Transformation Tracking', function() {
    it('should track waste transformation through digital twins', async function() {
      // Mock response
      const wasteId = 'waste-123';
      const trackingId = 'track-123';
      axiosPostStub.resolves({ data: { trackingId, wasteId, status: 'tracking' } });
      
      // Test data
      const twinChain = ['twin-1', 'twin-2', 'twin-3'];
      
      // Execute
      const result = await digitalTwinService.trackWasteTransformation(wasteId, twinChain);
      
      // Verify
      expect(result).to.have.property('trackingId', trackingId);
      expect(result).to.have.property('status', 'tracking');
      expect(axiosPostStub.calledOnce).to.be.true;
      
      // Verify correct endpoint and payload
      const [url, payload] = axiosPostStub.firstCall.args;
      expect(url).to.include('/waste-tracking');
      expect(payload).to.have.property('wasteId', wasteId);
      expect(payload).to.have.property('twinChain').that.deep.equals(twinChain);
    });
    
    it('should update waste transformation status', async function() {
      // Mock response
      const wasteId = 'waste-123';
      const twinId = 'twin-2';
      axiosPutStub.resolves({ data: { wasteId, status: 'processing' } });
      
      // Test data
      const status = 'processing';
      const metrics = {
        contaminationLevel: 0.05,
        processingEfficiency: 0.92
      };
      
      // Execute
      const result = await digitalTwinService.updateWasteTransformationStatus(
        wasteId, twinId, status, metrics
      );
      
      // Verify
      expect(result).to.have.property('status', status);
      expect(axiosPutStub.calledOnce).to.be.true;
      
      // Verify correct endpoint and payload
      const [url, payload] = axiosPutStub.firstCall.args;
      expect(url).to.include(`/waste-tracking/${wasteId}/status`);
      expect(payload).to.have.property('twinId', twinId);
      expect(payload).to.have.property('status', status);
      expect(payload).to.have.property('metrics').that.deep.equals(metrics);
      expect(payload).to.have.property('timestamp');
    });
  });
});