import axios from 'axios';
import digitalTwinService from '../digitalTwinService';
import { v4 as uuidv4 } from 'uuid';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn()
}));
const mockedUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('Digital Twin Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock WebSocket
    global.WebSocket = jest.fn().mockImplementation(() => ({
      readyState: 1, // OPEN
      send: jest.fn(),
      close: jest.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
    })) as any;
  });

  describe('Digital Twin Creation and Management', () => {
    it('should create a digital twin', async () => {
      // Mock response
      const twinId = 'twin-123';
      mockedAxios.post.mockResolvedValueOnce({ data: { twinId } });
      
      // Test data
      const twinData = {
        physicalAssetId: 'asset-123',
        name: 'Waste Processing Unit 1',
        type: 'equipment' as const,
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
          status: 'normal' as const
        }
      };
      
      // Execute
      const result = await digitalTwinService.createDigitalTwin(twinData);
      
      // Verify
      expect(result).toHaveProperty('twinId', twinId);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/digital-twins'),
        twinData
      );
    });
    
    it('should update digital twin state', async () => {
      // Mock response
      const twinId = 'twin-123';
      mockedAxios.put.mockResolvedValueOnce({ data: { twinId, status: 'updated' } });
      
      // Test data
      const newState = {
        parameters: {
          temperature: 30,
          pressure: 1.2
        },
        metrics: {
          efficiency: 0.9,
          throughput: 550,
          energyConsumption: 1100,
          qualityScore: 0.94,
          environmentalImpact: 0.25
        },
        status: 'normal' as const,
        alerts: []
      };
      
      // Execute
      const result = await digitalTwinService.updateTwinState(twinId, newState);
      
      // Verify
      expect(result).toHaveProperty('status', 'updated');
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/digital-twins/${twinId}/state`),
        { state: newState }
      );
    });
  });
  
  describe('WebSocket Communication', () => {
    it('should initialize WebSocket connection', async () => {
      // Setup WebSocket mock
      const mockWs = {
        readyState: 1, // OPEN
        send: jest.fn(),
        close: jest.fn(),
        onopen: null as any,
        onmessage: null as any,
        onerror: null as any,
        onclose: null as any,
      };
      
      global.WebSocket = jest.fn().mockImplementation(() => mockWs) as any;
      
      // Execute
      const connectPromise = digitalTwinService.initWebSocketConnection();
      
      // Simulate connection open
      mockWs.onopen();
      
      // Wait for promise to resolve
      await connectPromise;
      
      // Verify
      expect(global.WebSocket).toHaveBeenCalledWith(expect.stringContaining('/digital-twins'));
    });
    
    it('should send WebSocket messages', () => {
      // Setup
      const mockWs = {
        readyState: 1, // OPEN
        send: jest.fn(),
        close: jest.fn(),
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
      };
      
      global.WebSocket = jest.fn().mockImplementation(() => mockWs) as any;
      
      // Initialize connection
      digitalTwinService.initWebSocketConnection();
      
      // Set the connection
      (digitalTwinService as any).wsConnection = mockWs;
      
      // Test data
      const messageType = 'test_message';
      const messageData = { foo: 'bar' };
      
      // Execute
      const result = digitalTwinService.sendWebSocketMessage(messageType, messageData);
      
      // Verify
      expect(result).toBe(true);
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: messageType,
        data: messageData
      }));
    });
    
    it('should handle WebSocket messages', () => {
      // Setup
      const mockHandler = jest.fn();
      digitalTwinService.registerMessageHandler('test_message', mockHandler);
      
      // Execute
      (digitalTwinService as any).handleWebSocketMessage({
        type: 'test_message',
        data: { foo: 'bar' }
      });
      
      // Verify
      expect(mockHandler).toHaveBeenCalledWith({ foo: 'bar' });
    });
  });
  
  describe('Twin-to-Twin Communication', () => {
    it('should send messages between twins', async () => {
      // Mock uuid
      const communicationId = 'comm-123';
      mockedUuidv4.mockReturnValueOnce(communicationId);
      
      // Mock response
      mockedAxios.post.mockResolvedValueOnce({ data: { communicationId, status: 'sent' } });
      
      // Mock WebSocket send
      const mockSend = jest.fn();
      (digitalTwinService as any).wsConnection = {
        readyState: 1, // OPEN
        send: mockSend
      };
      
      // Test data
      const sourceTwinId = 'twin-source';
      const targetTwinId = 'twin-target';
      const messageType = 'state_sync' as const;
      const payload = {
        parameters: { temperature: 35 }
      };
      
      // Execute
      const result = await digitalTwinService.sendTwinToTwinMessage(
        sourceTwinId, targetTwinId, messageType, payload
      );
      
      // Verify
      expect(result).toHaveProperty('communicationId', communicationId);
      expect(result).toHaveProperty('status', 'sent');
      
      // Verify WebSocket message was sent
      expect(mockSend).toHaveBeenCalledWith(expect.any(String));
      const sentMessage = JSON.parse(mockSend.mock.calls[0][0]);
      expect(sentMessage.type).toBe('twin_to_twin_message');
      expect(sentMessage.data.data.sourceTwinId).toBe(sourceTwinId);
      expect(sentMessage.data.data.targetTwinId).toBe(targetTwinId);
      expect(sentMessage.data.data.messageType).toBe(messageType);
      
      // Verify REST API call
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/digital-twins/communications'),
        expect.objectContaining({
          communicationId,
          sourceTwinId,
          targetTwinId,
          messageType,
          payload
        })
      );
    });
  });
  
  describe('Lifecycle Simulation', () => {
    it('should create lifecycle simulations', async () => {
      // Mock uuid
      const simulationId = 'sim-123';
      mockedUuidv4.mockReturnValueOnce(simulationId);
      
      // Mock response
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { 
          simulationId, 
          status: 'initialized' 
        } 
      });
      
      // Test data
      const twinId = 'twin-123';
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
      expect(result).toHaveProperty('simulationId', simulationId);
      expect(result).toHaveProperty('status', 'initialized');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/digital-twins/${twinId}/lifecycle-simulation`),
        expect.objectContaining({
          simulationId,
          ...simulationConfig
        })
      );
    });
    
    it('should start, stop and get results from simulations', async () => {
      // Mock responses
      mockedAxios.post.mockResolvedValueOnce({ data: { status: 'running' } });
      mockedAxios.post.mockResolvedValueOnce({ data: { status: 'stopped' } });
      mockedAxios.get.mockResolvedValueOnce({ 
        data: { 
          results: {
            finalTemperature: 35,
            energyConsumed: 1500
          }
        }
      });
      
      // Test data
      const twinId = 'twin-123';
      const simulationId = 'sim-123';
      
      // Start simulation
      const startResult = await digitalTwinService.startLifecycleSimulation(twinId, simulationId);
      expect(startResult).toHaveProperty('status', 'running');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/digital-twins/${twinId}/lifecycle-simulation/${simulationId}/start`)
      );
      
      // Stop simulation
      const stopResult = await digitalTwinService.stopLifecycleSimulation(twinId, simulationId);
      expect(stopResult).toHaveProperty('status', 'stopped');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/digital-twins/${twinId}/lifecycle-simulation/${simulationId}/stop`)
      );
      
      // Get results
      const results = await digitalTwinService.getLifecycleSimulationResults(twinId, simulationId);
      expect(results).toHaveProperty('results.finalTemperature', 35);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/digital-twins/${twinId}/lifecycle-simulation/${simulationId}/results`)
      );
    });
  });
  
  describe('Waste Transformation Tracking', () => {
    it('should track waste transformation through digital twins', async () => {
      // Mock response
      const wasteId = 'waste-123';
      const trackingId = 'track-123';
      mockedAxios.post.mockResolvedValueOnce({ data: { trackingId, wasteId, status: 'tracking' } });
      
      // Test data
      const twinChain = ['twin-1', 'twin-2', 'twin-3'];
      
      // Execute
      const result = await digitalTwinService.trackWasteTransformation(wasteId, twinChain);
      
      // Verify
      expect(result).toHaveProperty('trackingId', trackingId);
      expect(result).toHaveProperty('status', 'tracking');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/digital-twins/waste-tracking'),
        expect.objectContaining({
          wasteId,
          twinChain
        })
      );
    });
    
    it('should update waste transformation status', async () => {
      // Mock response
      const wasteId = 'waste-123';
      const twinId = 'twin-2';
      mockedAxios.put.mockResolvedValueOnce({ data: { wasteId, status: 'processing' } });
      
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
      expect(result).toHaveProperty('status', 'processing');
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/digital-twins/waste-tracking/${wasteId}/status`),
        expect.objectContaining({
          twinId,
          status,
          metrics,
          timestamp: expect.any(String)
        })
      );
    });
  });
  
  describe('Alert Management', () => {
    it('should add alerts to digital twins', async () => {
      // Mock uuid
      const alertId = 'alert-123';
      mockedUuidv4.mockReturnValueOnce(alertId);
      
      // Mock response
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { 
          alertId,
          acknowledged: false
        } 
      });
      
      // Test data
      const twinId = 'twin-123';
      const alert = {
        type: 'environmental' as const,
        severity: 'warning' as const,
        message: 'High contamination level detected'
      };
      
      // Execute
      const result = await digitalTwinService.addAlert(twinId, alert);
      
      // Verify
      expect(result).toHaveProperty('alertId', alertId);
      expect(result).toHaveProperty('acknowledged', false);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/digital-twins/${twinId}/alerts`),
        expect.objectContaining({
          ...alert,
          alertId,
          timestamp: expect.any(String)
        })
      );
    });
  });
});