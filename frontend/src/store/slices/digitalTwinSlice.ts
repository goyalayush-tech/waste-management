import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface DigitalTwin {
  twinId: string;
  physicalAssetId: string;
  name: string;
  type: 'facility' | 'equipment' | 'process' | 'ecosystem';
  currentState: TwinState;
  historicalStates: TwinState[];
  predictiveModels: PredictiveModel[];
  simulationResults: SimulationResult[];
  realTimeSensors: SensorConnection[];
  lastUpdated: string;
  isActive: boolean;
  accuracy: number;
}

export interface TwinState {
  timestamp: string;
  parameters: Record<string, number>;
  metrics: {
    efficiency: number;
    throughput: number;
    energyConsumption: number;
    qualityScore: number;
    environmentalImpact: number;
  };
  alerts: Alert[];
  status: 'normal' | 'warning' | 'critical' | 'maintenance';
}

export interface PredictiveModel {
  modelId: string;
  modelType: 'lstm' | 'arima' | 'prophet' | 'quantum_enhanced';
  predictionType: 'failure' | 'efficiency' | 'throughput' | 'maintenance';
  accuracy: number;
  lastTrained: string;
  predictions: Prediction[];
  isActive: boolean;
}

export interface Prediction {
  timestamp: string;
  value: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface SimulationResult {
  simulationId: string;
  simulationType: 'what_if' | 'optimization' | 'stress_test' | 'policy_impact';
  parameters: Record<string, any>;
  results: {
    airQualityImpact: number;
    waterSystemImpact: number;
    urbanHealthImpact: number;
    economicImpact: number;
    carbonFootprint: number;
    processingEfficiency: number;
  };
  duration: number;
  accuracy: number;
  createdAt: string;
}

export interface SensorConnection {
  sensorId: string;
  sensorType: 'temperature' | 'pressure' | 'flow' | 'quality' | 'emissions';
  location: string;
  isConnected: boolean;
  lastReading: {
    value: number;
    timestamp: string;
    unit: string;
  };
  calibrationStatus: 'calibrated' | 'needs_calibration' | 'error';
}

export interface Alert {
  alertId: string;
  type: 'performance' | 'maintenance' | 'safety' | 'environmental';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export interface TwinCommunication {
  communicationId: string;
  sourceTwinId: string;
  targetTwinId: string;
  messageType: 'state_sync' | 'prediction_share' | 'alert_propagation' | 'optimization_request';
  payload: any;
  timestamp: string;
  status: 'sent' | 'received' | 'processed' | 'failed';
}

interface DigitalTwinState {
  twins: DigitalTwin[];
  selectedTwin: DigitalTwin | null;
  twinCommunications: TwinCommunication[];
  ecosystemOverview: {
    totalTwins: number;
    activeTwins: number;
    averageAccuracy: number;
    totalPredictions: number;
    alertsCount: number;
    syncStatus: 'synchronized' | 'syncing' | 'out_of_sync';
  };
  loading: boolean;
  error: string | null;
}

const initialState: DigitalTwinState = {
  twins: [],
  selectedTwin: null,
  twinCommunications: [],
  ecosystemOverview: {
    totalTwins: 0,
    activeTwins: 0,
    averageAccuracy: 0,
    totalPredictions: 0,
    alertsCount: 0,
    syncStatus: 'synchronized'
  },
  loading: false,
  error: null
};

export const createDigitalTwin = createAsyncThunk(
  'digitalTwin/create',
  async (twinData: {
    physicalAssetId: string;
    name: string;
    type: DigitalTwin['type'];
    initialState: Omit<TwinState, 'timestamp' | 'alerts'>;
  }) => {
    const response = await fetch('/api/digital-twins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(twinData)
    });
    return response.json();
  }
);

export const updateTwinState = createAsyncThunk(
  'digitalTwin/updateState',
  async (data: {
    twinId: string;
    newState: Omit<TwinState, 'timestamp'>;
  }) => {
    const response = await fetch(`/api/digital-twins/${data.twinId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: data.newState })
    });
    return response.json();
  }
);

export const runSimulation = createAsyncThunk(
  'digitalTwin/runSimulation',
  async (data: {
    twinId: string;
    simulationType: SimulationResult['simulationType'];
    parameters: Record<string, any>;
  }) => {
    const response = await fetch(`/api/digital-twins/${data.twinId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulationType: data.simulationType,
        parameters: data.parameters
      })
    });
    return response.json();
  }
);

export const trainPredictiveModel = createAsyncThunk(
  'digitalTwin/trainModel',
  async (data: {
    twinId: string;
    modelType: PredictiveModel['modelType'];
    predictionType: PredictiveModel['predictionType'];
    trainingData: any[];
  }) => {
    const response = await fetch(`/api/digital-twins/${data.twinId}/train-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export const generatePredictions = createAsyncThunk(
  'digitalTwin/generatePredictions',
  async (data: {
    twinId: string;
    modelId: string;
    timeHorizon: number;
  }) => {
    const response = await fetch(`/api/digital-twins/${data.twinId}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId: data.modelId,
        timeHorizon: data.timeHorizon
      })
    });
    return response.json();
  }
);

export const syncTwins = createAsyncThunk(
  'digitalTwin/syncTwins',
  async (twinIds: string[]) => {
    const response = await fetch('/api/digital-twins/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twinIds })
    });
    return response.json();
  }
);

export const connectSensor = createAsyncThunk(
  'digitalTwin/connectSensor',
  async (data: {
    twinId: string;
    sensorData: Omit<SensorConnection, 'isConnected' | 'lastReading' | 'calibrationStatus'>;
  }) => {
    const response = await fetch(`/api/digital-twins/${data.twinId}/sensors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.sensorData)
    });
    return response.json();
  }
);

export const acknowledgeAlert = createAsyncThunk(
  'digitalTwin/acknowledgeAlert',
  async (data: { twinId: string; alertId: string }) => {
    const response = await fetch(`/api/digital-twins/${data.twinId}/alerts/${data.alertId}/acknowledge`, {
      method: 'POST'
    });
    return response.json();
  }
);

export const getEcosystemOverview = createAsyncThunk(
  'digitalTwin/getEcosystemOverview',
  async () => {
    const response = await fetch('/api/digital-twins/ecosystem/overview');
    return response.json();
  }
);

const digitalTwinSlice = createSlice({
  name: 'digitalTwin',
  initialState,
  reducers: {
    setSelectedTwin(state, action: PayloadAction<DigitalTwin | null>) {
      state.selectedTwin = action.payload;
    },
    updateSensorReading(state, action: PayloadAction<{
      twinId: string;
      sensorId: string;
      reading: SensorConnection['lastReading'];
    }>) {
      const twin = state.twins.find(t => t.twinId === action.payload.twinId);
      if (twin) {
        const sensor = twin.realTimeSensors.find(s => s.sensorId === action.payload.sensorId);
        if (sensor) {
          sensor.lastReading = action.payload.reading;
        }
      }
    },
    addAlert(state, action: PayloadAction<{ twinId: string; alert: Alert }>) {
      const twin = state.twins.find(t => t.twinId === action.payload.twinId);
      if (twin && twin.currentState) {
        twin.currentState.alerts.push(action.payload.alert);
      }
    },
    updateTwinCommunication(state, action: PayloadAction<TwinCommunication>) {
      const existingIndex = state.twinCommunications.findIndex(
        c => c.communicationId === action.payload.communicationId
      );
      if (existingIndex !== -1) {
        state.twinCommunications[existingIndex] = action.payload;
      } else {
        state.twinCommunications.push(action.payload);
      }
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDigitalTwin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDigitalTwin.fulfilled, (state, action) => {
        state.loading = false;
        state.twins.push(action.payload);
      })
      .addCase(createDigitalTwin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create digital twin';
      })
      .addCase(updateTwinState.fulfilled, (state, action) => {
        const twin = state.twins.find(t => t.twinId === action.payload.twinId);
        if (twin) {
          twin.historicalStates.push(twin.currentState);
          twin.currentState = action.payload.newState;
          twin.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(runSimulation.fulfilled, (state, action) => {
        const twin = state.twins.find(t => t.twinId === action.payload.twinId);
        if (twin) {
          twin.simulationResults.push(action.payload.simulation);
        }
      })
      .addCase(trainPredictiveModel.fulfilled, (state, action) => {
        const twin = state.twins.find(t => t.twinId === action.payload.twinId);
        if (twin) {
          const existingModelIndex = twin.predictiveModels.findIndex(
            m => m.modelId === action.payload.model.modelId
          );
          if (existingModelIndex !== -1) {
            twin.predictiveModels[existingModelIndex] = action.payload.model;
          } else {
            twin.predictiveModels.push(action.payload.model);
          }
        }
      })
      .addCase(generatePredictions.fulfilled, (state, action) => {
        const twin = state.twins.find(t => t.twinId === action.payload.twinId);
        if (twin) {
          const model = twin.predictiveModels.find(m => m.modelId === action.payload.modelId);
          if (model) {
            model.predictions = action.payload.predictions;
          }
        }
      })
      .addCase(connectSensor.fulfilled, (state, action) => {
        const twin = state.twins.find(t => t.twinId === action.payload.twinId);
        if (twin) {
          twin.realTimeSensors.push(action.payload.sensor);
        }
      })
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const twin = state.twins.find(t => t.twinId === action.payload.twinId);
        if (twin && twin.currentState) {
          const alert = twin.currentState.alerts.find(a => a.alertId === action.payload.alertId);
          if (alert) {
            alert.acknowledged = true;
          }
        }
      })
      .addCase(getEcosystemOverview.fulfilled, (state, action) => {
        state.ecosystemOverview = action.payload;
      });
  }
});

export const { 
  setSelectedTwin, 
  updateSensorReading, 
  addAlert, 
  updateTwinCommunication, 
  clearError 
} = digitalTwinSlice.actions;

export default digitalTwinSlice.reducer;