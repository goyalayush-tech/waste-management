const axios = require('axios');
const ipfsService = require('./ipfsService');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
require('dotenv').config();

/**
 * Service for managing digital twins of waste processing
 * Enhanced with real-time state management and lifecycle simulation
 */
class DigitalTwinService {
  constructor() {
    this.apiBaseUrl = process.env.DIGITAL_TWIN_API_URL || 'http://localhost:3001/api/digital-twins';
    this.wsUrl = process.env.DIGITAL_TWIN_WS_URL || 'ws://localhost:3001/ws/digital-twins';
    this.activeTwins = new Map(); // Store active digital twins in memory
    this.twinConnections = new Map(); // Store twin-to-twin connections
    this.wsConnections = new Map(); // Store WebSocket connections for real-time updates
    this.simulationEngines = new Map(); // Store active simulation engines
    
    // Initialize WebSocket server for twin-to-twin communication
    this.initializeWebSocketServer();
  }
  
  /**
   * Initialize WebSocket server for real-time twin communication
   * @private
   */
  initializeWebSocketServer() {
    try {
      // Connect to the WebSocket server
      this.wsClient = new WebSocket(this.wsUrl);
      
      this.wsClient.on('open', () => {
        console.log('Connected to Digital Twin WebSocket server');
      });
      
      this.wsClient.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      this.wsClient.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      this.wsClient.on('close', () => {
        console.log('WebSocket connection closed, attempting to reconnect in 5 seconds...');
        setTimeout(() => this.initializeWebSocketServer(), 5000);
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
      // Retry connection after delay
      setTimeout(() => this.initializeWebSocketServer(), 5000);
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param {Object} message - The received message
   * @private
   */
  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'twin_state_update':
        this.handleTwinStateUpdate(message.data);
        break;
      case 'twin_to_twin_message':
        this.handleTwinToTwinMessage(message.data);
        break;
      case 'simulation_update':
        this.handleSimulationUpdate(message.data);
        break;
      case 'sensor_data':
        this.handleSensorData(message.data);
        break;
      default:
        console.log('Received unknown message type:', message.type);
    }
  }
  
  /**
   * Handle twin state updates from WebSocket
   * @param {Object} data - State update data
   * @private
   */
  handleTwinStateUpdate(data) {
    const { twinId, state } = data;
    const twin = this.activeTwins.get(twinId);
    
    if (twin) {
      // Store previous state in history
      if (!twin.historicalStates) {
        twin.historicalStates = [];
      }
      twin.historicalStates.push(twin.currentState);
      
      // Update current state
      twin.currentState = {
        ...state,
        timestamp: new Date().toISOString()
      };
      
      // Limit history size
      if (twin.historicalStates.length > 100) {
        twin.historicalStates.shift();
      }
      
      console.log(`Updated state for digital twin ${twinId} via WebSocket`);
      
      // Propagate state changes to connected twins
      this.propagateStateChanges(twinId, twin.currentState);
    }
  }
  
  /**
   * Handle twin-to-twin messages
   * @param {Object} data - Message data
   * @private
   */
  handleTwinToTwinMessage(data) {
    const { sourceTwinId, targetTwinId, messageType, payload } = data;
    console.log(`Received ${messageType} message from twin ${sourceTwinId} to twin ${targetTwinId}`);
    
    // Process message based on type
    switch (messageType) {
      case 'state_sync':
        this.processTwinStateSync(sourceTwinId, targetTwinId, payload);
        break;
      case 'prediction_share':
        this.processPredictionShare(sourceTwinId, targetTwinId, payload);
        break;
      case 'alert_propagation':
        this.processAlertPropagation(sourceTwinId, targetTwinId, payload);
        break;
      case 'optimization_request':
        this.processOptimizationRequest(sourceTwinId, targetTwinId, payload);
        break;
    }
  }
  
  /**
   * Handle simulation updates
   * @param {Object} data - Simulation update data
   * @private
   */
  handleSimulationUpdate(data) {
    const { simulationId, twinId, status, results } = data;
    const engine = this.simulationEngines.get(simulationId);
    
    if (engine) {
      engine.status = status;
      engine.lastUpdated = new Date().toISOString();
      
      if (results) {
        engine.results = results;
      }
      
      console.log(`Updated simulation ${simulationId} for twin ${twinId}: ${status}`);
    }
  }
  
  /**
   * Handle incoming sensor data
   * @param {Object} data - Sensor data
   * @private
   */
  handleSensorData(data) {
    const { twinId, sensorId, reading } = data;
    this.updateSensorReading(twinId, sensorId, reading, true);
  }
  
  /**
   * Create a new digital twin
   * @param {Object} twinData - Digital twin data
   * @returns {Promise<Object>} - Created digital twin
   */
  async createDigitalTwin(twinData) {
    try {
      const response = await axios.post(this.apiBaseUrl, twinData);
      console.log(`Created digital twin with ID: ${response.data.twinId}`);
      
      // Store twin data on IPFS for decentralized backup
      const cid = await ipfsService.storeMetadata({
        type: 'digital-twin',
        twinId: response.data.twinId,
        ...twinData
      });
      
      // Update twin with IPFS reference
      await this.updateTwinMetadata(response.data.twinId, { ipfsCid: cid });
      
      return response.data;
    } catch (error) {
      console.error('Error creating digital twin:', error);
      throw error;
    }
  }
  
  /**
   * Get digital twin by ID
   * @param {string} twinId - Digital twin ID
   * @returns {Promise<Object>} - Digital twin data
   */
  async getDigitalTwin(twinId) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/${twinId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update digital twin state
   * @param {string} twinId - Digital twin ID
   * @param {Object} newState - New state data
   * @returns {Promise<Object>} - Updated digital twin
   */
  async updateTwinState(twinId, newState) {
    try {
      const response = await axios.put(
        `${this.apiBaseUrl}/${twinId}/state`,
        { state: newState }
      );
      
      console.log(`Updated state for digital twin ${twinId}`);
      return response.data;
    } catch (error) {
      console.error(`Error updating state for digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update digital twin metadata
   * @param {string} twinId - Digital twin ID
   * @param {Object} metadata - Metadata to update
   * @returns {Promise<Object>} - Updated digital twin
   */
  async updateTwinMetadata(twinId, metadata) {
    try {
      const response = await axios.put(
        `${this.apiBaseUrl}/${twinId}/metadata`,
        metadata
      );
      
      console.log(`Updated metadata for digital twin ${twinId}`);
      return response.data;
    } catch (error) {
      console.error(`Error updating metadata for digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Link digital twin to NFT certificate
   * @param {string} twinId - Digital twin ID
   * @param {string} tokenId - NFT token ID
   * @param {string} contractAddress - NFT contract address
   * @returns {Promise<Object>} - Updated digital twin
   */
  async linkTwinToNFT(twinId, tokenId, contractAddress) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/${twinId}/link-nft`,
        {
          tokenId,
          contractAddress
        }
      );
      
      console.log(`Linked digital twin ${twinId} to NFT ${tokenId}`);
      return response.data;
    } catch (error) {
      console.error(`Error linking digital twin ${twinId} to NFT ${tokenId}:`, error);
      throw error;
    }
  }
  
  /**
   * Run simulation on digital twin
   * @param {string} twinId - Digital twin ID
   * @param {string} simulationType - Type of simulation
   * @param {Object} parameters - Simulation parameters
   * @returns {Promise<Object>} - Simulation results
   */
  async runSimulation(twinId, simulationType, parameters) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/${twinId}/simulate`,
        {
          simulationType,
          parameters
        }
      );
      
      console.log(`Ran ${simulationType} simulation for digital twin ${twinId}`);
      return response.data;
    } catch (error) {
      console.error(`Error running simulation for digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Connect sensor to digital twin
   * @param {string} twinId - Digital twin ID
   * @param {Object} sensorData - Sensor data
   * @returns {Promise<Object>} - Updated digital twin
   */
  async connectSensor(twinId, sensorData) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/${twinId}/sensors`,
        sensorData
      );
      
      console.log(`Connected sensor ${sensorData.sensorId} to digital twin ${twinId}`);
      return response.data;
    } catch (error) {
      console.error(`Error connecting sensor to digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update sensor reading for digital twin
   * @param {string} twinId - Digital twin ID
   * @param {string} sensorId - Sensor ID
   * @param {Object} reading - Sensor reading
   * @returns {Promise<Object>} - Updated digital twin
   */
  async updateSensorReading(twinId, sensorId, reading) {
    try {
      const response = await axios.put(
        `${this.apiBaseUrl}/${twinId}/sensors/${sensorId}/reading`,
        { reading }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating sensor reading for digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Synchronize multiple digital twins
   * @param {Array<string>} twinIds - Array of digital twin IDs
   * @returns {Promise<Object>} - Synchronization result
   */
  async syncTwins(twinIds) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/sync`,
        { twinIds }
      );
      
      console.log(`Synchronized ${twinIds.length} digital twins`);
      return response.data;
    } catch (error) {
      console.error('Error synchronizing digital twins:', error);
      throw error;
    }
  }
  
  /**
   * Get ecosystem overview
   * @returns {Promise<Object>} - Ecosystem overview data
   */
  async getEcosystemOverview() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/ecosystem/overview`);
      return response.data;
    } catch (error) {
      console.error('Error getting ecosystem overview:', error);
      throw error;
    }
  }
  
  /**
   * Process twin state synchronization message
   * @param {string} sourceTwinId - Source twin ID
   * @param {string} targetTwinId - Target twin ID
   * @param {Object} payload - Message payload
   * @private
   */
  processTwinStateSync(sourceTwinId, targetTwinId, payload) {
    const targetTwin = this.activeTwins.get(targetTwinId);
    if (targetTwin) {
      // Update relevant parameters based on source twin state
      const { parameters, metrics } = payload;
      
      // Apply state changes to target twin
      if (parameters) {
        targetTwin.currentState.parameters = {
          ...targetTwin.currentState.parameters,
          ...parameters
        };
      }
      
      if (metrics) {
        targetTwin.currentState.metrics = {
          ...targetTwin.currentState.metrics,
          ...metrics
        };
      }
      
      // Log the synchronization
      console.log(`Synchronized state from twin ${sourceTwinId} to twin ${targetTwinId}`);
      
      // Update twin state in database
      this.updateTwinState(targetTwinId, targetTwin.currentState).catch(error => {
        console.error(`Error updating twin state after sync: ${error}`);
      });
    }
  }
  
  /**
   * Process prediction sharing between twins
   * @param {string} sourceTwinId - Source twin ID
   * @param {string} targetTwinId - Target twin ID
   * @param {Object} payload - Message payload
   * @private
   */
  processPredictionShare(sourceTwinId, targetTwinId, payload) {
    const targetTwin = this.activeTwins.get(targetTwinId);
    if (targetTwin) {
      const { predictionType, predictions } = payload;
      
      // Store the received predictions for use in target twin's operations
      if (!targetTwin.externalPredictions) {
        targetTwin.externalPredictions = {};
      }
      
      if (!targetTwin.externalPredictions[sourceTwinId]) {
        targetTwin.externalPredictions[sourceTwinId] = {};
      }
      
      targetTwin.externalPredictions[sourceTwinId][predictionType] = {
        predictions,
        timestamp: new Date().toISOString()
      };
      
      console.log(`Received ${predictionType} predictions from twin ${sourceTwinId}`);
    }
  }
  
  /**
   * Process alert propagation between twins
   * @param {string} sourceTwinId - Source twin ID
   * @param {string} targetTwinId - Target twin ID
   * @param {Object} payload - Message payload
   * @private
   */
  processAlertPropagation(sourceTwinId, targetTwinId, payload) {
    const targetTwin = this.activeTwins.get(targetTwinId);
    if (targetTwin) {
      const { alert } = payload;
      
      // Add the propagated alert to the target twin
      if (!targetTwin.currentState.alerts) {
        targetTwin.currentState.alerts = [];
      }
      
      // Add source information to the alert
      const propagatedAlert = {
        ...alert,
        propagatedFrom: sourceTwinId,
        propagatedAt: new Date().toISOString()
      };
      
      targetTwin.currentState.alerts.push(propagatedAlert);
      
      // Update twin state in database
      this.updateTwinState(targetTwinId, targetTwin.currentState).catch(error => {
        console.error(`Error updating twin state after alert propagation: ${error}`);
      });
      
      console.log(`Propagated alert from twin ${sourceTwinId} to twin ${targetTwinId}`);
    }
  }
  
  /**
   * Process optimization request between twins
   * @param {string} sourceTwinId - Source twin ID
   * @param {string} targetTwinId - Target twin ID
   * @param {Object} payload - Message payload
   * @private
   */
  processOptimizationRequest(sourceTwinId, targetTwinId, payload) {
    const targetTwin = this.activeTwins.get(targetTwinId);
    if (targetTwin) {
      const { optimizationGoal, constraints } = payload;
      
      // Queue optimization task
      this.queueOptimizationTask(targetTwinId, {
        requestedBy: sourceTwinId,
        optimizationGoal,
        constraints,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Queued optimization request from twin ${sourceTwinId} for twin ${targetTwinId}`);
    }
  }
  
  /**
   * Queue optimization task for a twin
   * @param {string} twinId - Twin ID
   * @param {Object} task - Optimization task
   * @private
   */
  queueOptimizationTask(twinId, task) {
    const twin = this.activeTwins.get(twinId);
    if (twin) {
      if (!twin.optimizationTasks) {
        twin.optimizationTasks = [];
      }
      
      twin.optimizationTasks.push(task);
      
      // Process optimization tasks (in real implementation, this might be handled by a separate worker)
      this.processOptimizationTasks(twinId).catch(error => {
        console.error(`Error processing optimization tasks: ${error}`);
      });
    }
  }
  
  /**
   * Process optimization tasks for a twin
   * @param {string} twinId - Twin ID
   * @private
   */
  async processOptimizationTasks(twinId) {
    const twin = this.activeTwins.get(twinId);
    if (twin && twin.optimizationTasks && twin.optimizationTasks.length > 0) {
      const task = twin.optimizationTasks[0];
      
      try {
        // Run optimization simulation
        const result = await this.runSimulation(twinId, 'optimization', {
          goal: task.optimizationGoal,
          constraints: task.constraints
        });
        
        // Apply optimization results if available
        if (result && result.optimizedParameters) {
          await this.updateTwinState(twinId, {
            ...twin.currentState,
            parameters: {
              ...twin.currentState.parameters,
              ...result.optimizedParameters
            }
          });
        }
        
        // Send response to requesting twin
        this.sendTwinToTwinMessage(twinId, task.requestedBy, 'optimization_response', {
          originalRequest: task,
          result: result
        });
        
        // Remove processed task
        twin.optimizationTasks.shift();
      } catch (error) {
        console.error(`Error processing optimization task: ${error}`);
        
        // Move failed task to end of queue for retry
        const failedTask = twin.optimizationTasks.shift();
        failedTask.retryCount = (failedTask.retryCount || 0) + 1;
        
        if (failedTask.retryCount < 3) {
          twin.optimizationTasks.push(failedTask);
        } else {
          console.error(`Discarding optimization task after 3 failed attempts: ${JSON.stringify(failedTask)}`);
        }
      }
    }
  }
  
  /**
   * Send message from one twin to another
   * @param {string} sourceTwinId - Source twin ID
   * @param {string} targetTwinId - Target twin ID
   * @param {string} messageType - Message type
   * @param {Object} payload - Message payload
   * @returns {Promise<Object>} - Message status
   */
  async sendTwinToTwinMessage(sourceTwinId, targetTwinId, messageType, payload) {
    try {
      const communicationId = uuidv4();
      
      const message = {
        communicationId,
        sourceTwinId,
        targetTwinId,
        messageType,
        payload,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      // Send message via WebSocket if available
      if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
        this.wsClient.send(JSON.stringify({
          type: 'twin_to_twin_message',
          data: message
        }));
      }
      
      // Also send via REST API for persistence
      const response = await axios.post(
        `${this.apiBaseUrl}/communications`,
        message
      );
      
      console.log(`Sent ${messageType} message from twin ${sourceTwinId} to twin ${targetTwinId}`);
      return response.data;
    } catch (error) {
      console.error(`Error sending twin-to-twin message: ${error}`);
      throw error;
    }
  }
  
  /**
   * Propagate state changes to connected twins
   * @param {string} sourceTwinId - Source twin ID
   * @param {Object} state - Current state
   * @private
   */
  propagateStateChanges(sourceTwinId, state) {
    const connections = this.twinConnections.get(sourceTwinId);
    if (connections && connections.length > 0) {
      // Extract relevant state parameters to propagate
      const relevantParameters = {};
      const relevantMetrics = {};
      
      // Determine which parameters and metrics to propagate based on connection type
      connections.forEach(connection => {
        const targetTwinId = connection.targetTwinId;
        
        // Prepare payload based on connection type
        let payload = {};
        
        switch (connection.type) {
          case 'input_output':
            // For input/output connections, propagate specific parameters
            connection.parameters.forEach(param => {
              if (state.parameters[param]) {
                if (!relevantParameters[targetTwinId]) {
                  relevantParameters[targetTwinId] = {};
                }
                relevantParameters[targetTwinId][param] = state.parameters[param];
              }
            });
            payload = { parameters: relevantParameters[targetTwinId] };
            break;
            
          case 'monitoring':
            // For monitoring connections, propagate metrics
            connection.metrics.forEach(metric => {
              if (state.metrics[metric]) {
                if (!relevantMetrics[targetTwinId]) {
                  relevantMetrics[targetTwinId] = {};
                }
                relevantMetrics[targetTwinId][metric] = state.metrics[metric];
              }
            });
            payload = { metrics: relevantMetrics[targetTwinId] };
            break;
            
          case 'full_sync':
            // For full sync, propagate all state
            payload = { parameters: state.parameters, metrics: state.metrics };
            break;
        }
        
        // Send state sync message to connected twin
        this.sendTwinToTwinMessage(sourceTwinId, targetTwinId, 'state_sync', payload).catch(error => {
          console.error(`Error propagating state changes: ${error}`);
        });
      });
    }
  }
  
  /**
   * Connect two digital twins
   * @param {string} sourceTwinId - Source twin ID
   * @param {string} targetTwinId - Target twin ID
   * @param {string} connectionType - Connection type ('input_output', 'monitoring', 'full_sync')
   * @param {Object} connectionParams - Connection parameters
   * @returns {Promise<Object>} - Connection result
   */
  async connectTwins(sourceTwinId, targetTwinId, connectionType, connectionParams) {
    try {
      // Create connection in API
      const response = await axios.post(
        `${this.apiBaseUrl}/connections`,
        {
          sourceTwinId,
          targetTwinId,
          connectionType,
          ...connectionParams
        }
      );
      
      // Store connection locally
      if (!this.twinConnections.has(sourceTwinId)) {
        this.twinConnections.set(sourceTwinId, []);
      }
      
      this.twinConnections.get(sourceTwinId).push({
        targetTwinId,
        type: connectionType,
        ...connectionParams
      });
      
      console.log(`Connected twin ${sourceTwinId} to twin ${targetTwinId} with ${connectionType} connection`);
      return response.data;
    } catch (error) {
      console.error(`Error connecting twins: ${error}`);
      throw error;
    }
  }
  
  /**
   * Create lifecycle simulation engine for a digital twin
   * @param {string} twinId - Digital twin ID
   * @param {Object} simulationConfig - Simulation configuration
   * @returns {Promise<Object>} - Created simulation engine
   */
  async createLifecycleSimulation(twinId, simulationConfig) {
    try {
      const simulationId = uuidv4();
      
      // Create simulation in API
      const response = await axios.post(
        `${this.apiBaseUrl}/${twinId}/lifecycle-simulation`,
        {
          simulationId,
          ...simulationConfig
        }
      );
      
      // Store simulation engine locally
      this.simulationEngines.set(simulationId, {
        twinId,
        config: simulationConfig,
        status: 'initialized',
        results: null,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      
      console.log(`Created lifecycle simulation ${simulationId} for twin ${twinId}`);
      return {
        simulationId,
        ...response.data
      };
    } catch (error) {
      console.error(`Error creating lifecycle simulation: ${error}`);
      throw error;
    }
  }
  
  /**
   * Start lifecycle simulation
   * @param {string} simulationId - Simulation ID
   * @returns {Promise<Object>} - Simulation status
   */
  async startLifecycleSimulation(simulationId) {
    try {
      const engine = this.simulationEngines.get(simulationId);
      if (!engine) {
        throw new Error(`Simulation engine ${simulationId} not found`);
      }
      
      // Start simulation in API
      const response = await axios.post(
        `${this.apiBaseUrl}/${engine.twinId}/lifecycle-simulation/${simulationId}/start`
      );
      
      // Update local engine status
      engine.status = 'running';
      engine.lastUpdated = new Date().toISOString();
      
      console.log(`Started lifecycle simulation ${simulationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error starting lifecycle simulation: ${error}`);
      throw error;
    }
  }
  
  /**
   * Stop lifecycle simulation
   * @param {string} simulationId - Simulation ID
   * @returns {Promise<Object>} - Simulation status
   */
  async stopLifecycleSimulation(simulationId) {
    try {
      const engine = this.simulationEngines.get(simulationId);
      if (!engine) {
        throw new Error(`Simulation engine ${simulationId} not found`);
      }
      
      // Stop simulation in API
      const response = await axios.post(
        `${this.apiBaseUrl}/${engine.twinId}/lifecycle-simulation/${simulationId}/stop`
      );
      
      // Update local engine status
      engine.status = 'stopped';
      engine.lastUpdated = new Date().toISOString();
      
      console.log(`Stopped lifecycle simulation ${simulationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error stopping lifecycle simulation: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get lifecycle simulation results
   * @param {string} simulationId - Simulation ID
   * @returns {Promise<Object>} - Simulation results
   */
  async getLifecycleSimulationResults(simulationId) {
    try {
      const engine = this.simulationEngines.get(simulationId);
      if (!engine) {
        throw new Error(`Simulation engine ${simulationId} not found`);
      }
      
      // Get simulation results from API
      const response = await axios.get(
        `${this.apiBaseUrl}/${engine.twinId}/lifecycle-simulation/${simulationId}/results`
      );
      
      // Update local engine results
      engine.results = response.data.results;
      engine.lastUpdated = new Date().toISOString();
      
      return response.data;
    } catch (error) {
      console.error(`Error getting lifecycle simulation results: ${error}`);
      throw error;
    }
  }
  
  /**
   * Track waste transformation through digital twins
   * @param {string} wasteId - Waste ID
   * @param {Array<string>} twinChain - Chain of digital twin IDs representing the waste processing chain
   * @returns {Promise<Object>} - Tracking result
   */
  async trackWasteTransformation(wasteId, twinChain) {
    try {
      // Create tracking record in API
      const response = await axios.post(
        `${this.apiBaseUrl}/waste-tracking`,
        {
          wasteId,
          twinChain
        }
      );
      
      console.log(`Started tracking waste ${wasteId} through ${twinChain.length} digital twins`);
      return response.data;
    } catch (error) {
      console.error(`Error tracking waste transformation: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get waste transformation tracking data
   * @param {string} wasteId - Waste ID
   * @returns {Promise<Object>} - Tracking data
   */
  async getWasteTransformationTracking(wasteId) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/waste-tracking/${wasteId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting waste transformation tracking: ${error}`);
      throw error;
    }
  }
  
  /**
   * Update waste transformation status
   * @param {string} wasteId - Waste ID
   * @param {string} twinId - Current twin ID
   * @param {string} status - Processing status
   * @param {Object} metrics - Processing metrics
   * @returns {Promise<Object>} - Updated tracking data
   */
  async updateWasteTransformationStatus(wasteId, twinId, status, metrics) {
    try {
      const response = await axios.put(
        `${this.apiBaseUrl}/waste-tracking/${wasteId}/status`,
        {
          twinId,
          status,
          metrics,
          timestamp: new Date().toISOString()
        }
      );
      
      console.log(`Updated waste ${wasteId} transformation status to ${status} at twin ${twinId}`);
      return response.data;
    } catch (error) {
      console.error(`Error updating waste transformation status: ${error}`);
      throw error;
    }
  }
}

module.exports = new DigitalTwinService();