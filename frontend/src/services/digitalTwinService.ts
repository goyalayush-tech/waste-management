import axios from 'axios';
import { 
  DigitalTwin, 
  TwinState, 
  SimulationResult, 
  PredictiveModel, 
  SensorConnection, 
  TwinCommunication, 
  Alert 
} from '../store/slices/digitalTwinSlice';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';

/**
 * Service for interacting with digital twins
 * Enhanced with real-time state management and lifecycle simulation
 */
export class DigitalTwinService {
  private wsConnection: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  
  /**
   * Initialize WebSocket connection for real-time updates
   * @returns Promise that resolves when connection is established or rejects on failure
   */
  initWebSocketConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }
        
        this.wsConnection = new WebSocket(`${WS_URL}/digital-twins`);
        
        this.wsConnection.onopen = () => {
          console.log('Connected to Digital Twin WebSocket server');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.wsConnection.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.wsConnection.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        this.wsConnection.onclose = () => {
          console.log('WebSocket connection closed');
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('Failed to initialize WebSocket connection:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Attempt to reconnect to WebSocket server
   * @private
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.initWebSocketConnection().catch(() => {
        // Error handling is done in the promise
      });
    }, delay);
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param message - The received message
   * @private
   */
  private handleWebSocketMessage(message: any): void {
    const { type, data } = message;
    
    // Call registered handler for this message type if exists
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(data);
    } else {
      console.log(`No handler registered for message type: ${type}`);
    }
  }
  
  /**
   * Register a handler for a specific message type
   * @param messageType - Type of message to handle
   * @param handler - Handler function
   */
  registerMessageHandler(messageType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(messageType, handler);
  }
  
  /**
   * Send a message through WebSocket connection
   * @param type - Message type
   * @param data - Message data
   * @returns True if message was sent, false otherwise
   */
  sendWebSocketMessage(type: string, data: any): boolean {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      console.error('WebSocket connection not open');
      return false;
    }
    
    try {
      this.wsConnection.send(JSON.stringify({ type, data }));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }
  /**
   * Create a new digital twin
   * @param twinData - Digital twin data
   * @returns Created digital twin
   */
  async createDigitalTwin(twinData: {
    physicalAssetId: string;
    name: string;
    type: DigitalTwin['type'];
    initialState: Omit<TwinState, 'timestamp' | 'alerts'>;
  }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/digital-twins`, twinData);
      return response.data;
    } catch (error) {
      console.error('Error creating digital twin:', error);
      throw error;
    }
  }
  
  /**
   * Get digital twin by ID
   * @param twinId - Digital twin ID
   * @returns Digital twin data
   */
  async getDigitalTwin(twinId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/digital-twins/${twinId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update digital twin state
   * @param twinId - Digital twin ID
   * @param newState - New state data
   * @returns Updated digital twin
   */
  async updateTwinState(twinId: string, newState: Omit<TwinState, 'timestamp'>) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/digital-twins/${twinId}/state`,
        { state: newState }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating state for digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Link digital twin to NFT certificate
   * @param twinId - Digital twin ID
   * @param tokenId - NFT token ID
   * @param contractAddress - NFT contract address
   * @returns Updated digital twin
   */
  async linkTwinToNFT(twinId: string, tokenId: string, contractAddress: string) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/${twinId}/link-nft`,
        { tokenId, contractAddress }
      );
      return response.data;
    } catch (error) {
      console.error(`Error linking digital twin ${twinId} to NFT ${tokenId}:`, error);
      throw error;
    }
  }
  
  /**
   * Run simulation on digital twin
   * @param twinId - Digital twin ID
   * @param simulationType - Type of simulation
   * @param parameters - Simulation parameters
   * @returns Simulation results
   */
  async runSimulation(twinId: string, simulationType: SimulationResult['simulationType'], parameters: Record<string, any>) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/${twinId}/simulate`,
        { simulationType, parameters }
      );
      return response.data;
    } catch (error) {
      console.error(`Error running simulation for digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Train predictive model for digital twin
   * @param twinId - Digital twin ID
   * @param modelType - Type of model
   * @param predictionType - Type of prediction
   * @param trainingData - Training data
   * @returns Trained model
   */
  async trainPredictiveModel(
    twinId: string,
    modelType: PredictiveModel['modelType'],
    predictionType: PredictiveModel['predictionType'],
    trainingData: any[]
  ) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/${twinId}/train-model`,
        { modelType, predictionType, trainingData }
      );
      return response.data;
    } catch (error) {
      console.error(`Error training model for digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate predictions using trained model
   * @param twinId - Digital twin ID
   * @param modelId - Model ID
   * @param timeHorizon - Time horizon for predictions
   * @returns Predictions
   */
  async generatePredictions(twinId: string, modelId: string, timeHorizon: number) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/${twinId}/predict`,
        { modelId, timeHorizon }
      );
      return response.data;
    } catch (error) {
      console.error(`Error generating predictions for digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Connect sensor to digital twin
   * @param twinId - Digital twin ID
   * @param sensorData - Sensor data
   * @returns Updated digital twin
   */
  async connectSensor(
    twinId: string,
    sensorData: Omit<SensorConnection, 'isConnected' | 'lastReading' | 'calibrationStatus'>
  ) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/${twinId}/sensors`,
        sensorData
      );
      return response.data;
    } catch (error) {
      console.error(`Error connecting sensor to digital twin ${twinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Synchronize multiple digital twins
   * @param twinIds - Array of digital twin IDs
   * @returns Synchronization result
   */
  async syncTwins(twinIds: string[]) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/sync`,
        { twinIds }
      );
      return response.data;
    } catch (error) {
      console.error('Error synchronizing digital twins:', error);
      throw error;
    }
  }
  
  /**
   * Get ecosystem overview
   * @returns Ecosystem overview data
   */
  async getEcosystemOverview() {
    try {
      const response = await axios.get(`${API_BASE_URL}/digital-twins/ecosystem/overview`);
      return response.data;
    } catch (error) {
      console.error('Error getting ecosystem overview:', error);
      throw error;
    }
  }
  
  /**
   * Send message from one twin to another
   * @param sourceTwinId - Source twin ID
   * @param targetTwinId - Target twin ID
   * @param messageType - Message type
   * @param payload - Message payload
   * @returns Message status
   */
  async sendTwinToTwinMessage(
    sourceTwinId: string, 
    targetTwinId: string, 
    messageType: TwinCommunication['messageType'], 
    payload: any
  ) {
    try {
      const communicationId = uuidv4();
      
      const message = {
        communicationId,
        sourceTwinId,
        targetTwinId,
        messageType,
        payload,
        timestamp: new Date().toISOString(),
        status: 'sent' as const
      };
      
      // Send message via WebSocket if available
      this.sendWebSocketMessage('twin_to_twin_message', { data: message });
      
      // Also send via REST API for persistence
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/communications`,
        message
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error sending twin-to-twin message:`, error);
      throw error;
    }
  }
  
  /**
   * Connect two digital twins
   * @param sourceTwinId - Source twin ID
   * @param targetTwinId - Target twin ID
   * @param connectionType - Connection type ('input_output', 'monitoring', 'full_sync')
   * @param connectionParams - Connection parameters
   * @returns Connection result
   */
  async connectTwins(
    sourceTwinId: string, 
    targetTwinId: string, 
    connectionType: 'input_output' | 'monitoring' | 'full_sync', 
    connectionParams: Record<string, any>
  ) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/connections`,
        {
          sourceTwinId,
          targetTwinId,
          connectionType,
          ...connectionParams
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error connecting twins:`, error);
      throw error;
    }
  }
  
  /**
   * Create lifecycle simulation engine for a digital twin
   * @param twinId - Digital twin ID
   * @param simulationConfig - Simulation configuration
   * @returns Created simulation engine
   */
  async createLifecycleSimulation(twinId: string, simulationConfig: Record<string, any>) {
    try {
      const simulationId = uuidv4();
      
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/${twinId}/lifecycle-simulation`,
        {
          simulationId,
          ...simulationConfig
        }
      );
      
      return {
        simulationId,
        ...response.data
      };
    } catch (error) {
      console.error(`Error creating lifecycle simulation:`, error);
      throw error;
    }
  }
  
  /**
   * Start lifecycle simulation
   * @param twinId - Digital twin ID
   * @param simulationId - Simulation ID
   * @returns Simulation status
   */
  async startLifecycleSimulation(twinId: string, simulationId: string) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/${twinId}/lifecycle-simulation/${simulationId}/start`
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error starting lifecycle simulation:`, error);
      throw error;
    }
  }
  
  /**
   * Stop lifecycle simulation
   * @param twinId - Digital twin ID
   * @param simulationId - Simulation ID
   * @returns Simulation status
   */
  async stopLifecycleSimulation(twinId: string, simulationId: string) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/${twinId}/lifecycle-simulation/${simulationId}/stop`
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error stopping lifecycle simulation:`, error);
      throw error;
    }
  }
  
  /**
   * Get lifecycle simulation results
   * @param twinId - Digital twin ID
   * @param simulationId - Simulation ID
   * @returns Simulation results
   */
  async getLifecycleSimulationResults(twinId: string, simulationId: string) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/digital-twins/${twinId}/lifecycle-simulation/${simulationId}/results`
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting lifecycle simulation results:`, error);
      throw error;
    }
  }
  
  /**
   * Track waste transformation through digital twins
   * @param wasteId - Waste ID
   * @param twinChain - Chain of digital twin IDs representing the waste processing chain
   * @returns Tracking result
   */
  async trackWasteTransformation(wasteId: string, twinChain: string[]) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/waste-tracking`,
        {
          wasteId,
          twinChain
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error tracking waste transformation:`, error);
      throw error;
    }
  }
  
  /**
   * Get waste transformation tracking data
   * @param wasteId - Waste ID
   * @returns Tracking data
   */
  async getWasteTransformationTracking(wasteId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/digital-twins/waste-tracking/${wasteId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting waste transformation tracking:`, error);
      throw error;
    }
  }
  
  /**
   * Update waste transformation status
   * @param wasteId - Waste ID
   * @param twinId - Current twin ID
   * @param status - Processing status
   * @param metrics - Processing metrics
   * @returns Updated tracking data
   */
  async updateWasteTransformationStatus(
    wasteId: string, 
    twinId: string, 
    status: string, 
    metrics: Record<string, any>
  ) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/digital-twins/waste-tracking/${wasteId}/status`,
        {
          twinId,
          status,
          metrics,
          timestamp: new Date().toISOString()
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating waste transformation status:`, error);
      throw error;
    }
  }
  
  /**
   * Add alert to digital twin
   * @param twinId - Digital twin ID
   * @param alert - Alert data
   * @returns Updated digital twin
   */
  async addAlert(twinId: string, alert: Omit<Alert, 'alertId' | 'timestamp'>) {
    try {
      const alertData = {
        ...alert,
        alertId: uuidv4(),
        timestamp: new Date().toISOString()
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/digital-twins/${twinId}/alerts`,
        alertData
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error adding alert to digital twin ${twinId}:`, error);
      throw error;
    }
  }
}

export default new DigitalTwinService();