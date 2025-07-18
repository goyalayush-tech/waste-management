import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface QuantumComputation {
  computationId: string;
  type: 'optimization' | 'simulation' | 'machine_learning' | 'prediction';
  status: 'queued' | 'running' | 'completed' | 'failed';
  inputData: any;
  result?: any;
  startTime: string;
  endTime?: string;
  duration?: number;
  quantumAdvantage?: number;
  errorRate?: number;
}

export interface QuantumOptimizationResult {
  optimizedParameters: Record<string, number>;
  objectiveValue: number;
  convergenceSteps: number;
  quantumSpeedup: number;
  classicalComparison: number;
}

export interface QuantumPrediction {
  predictionId: string;
  predictionType: 'waste_generation' | 'processing_capacity' | 'environmental_impact' | 'market_trends';
  timeHorizon: '1_year' | '5_year' | '10_year';
  confidence: number;
  accuracy: number;
  predictions: {
    timestamp: string;
    value: number;
    uncertainty: number;
  }[];
  quantumEnhanced: boolean;
}

export interface DigitalTwinSimulation {
  simulationId: string;
  twinId: string;
  simulationType: 'waste_flow' | 'environmental_impact' | 'policy_scenario' | 'infrastructure_planning';
  parameters: Record<string, any>;
  results: {
    airQualityImpact: number;
    waterSystemImpact: number;
    urbanHealthImpact: number;
    economicImpact: number;
    carbonFootprint: number;
  };
  quantumAccelerated: boolean;
  simulationTime: number;
  accuracy: number;
}

interface QuantumState {
  computations: QuantumComputation[];
  predictions: QuantumPrediction[];
  simulations: DigitalTwinSimulation[];
  currentComputation: QuantumComputation | null;
  quantumResources: {
    availableQubits: number;
    usedQubits: number;
    queueLength: number;
    averageWaitTime: number;
    systemEfficiency: number;
  };
  performanceMetrics: {
    totalComputations: number;
    successRate: number;
    averageSpeedup: number;
    quantumAdvantageAchieved: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: QuantumState = {
  computations: [],
  predictions: [],
  simulations: [],
  currentComputation: null,
  quantumResources: {
    availableQubits: 127,
    usedQubits: 0,
    queueLength: 0,
    averageWaitTime: 0,
    systemEfficiency: 0
  },
  performanceMetrics: {
    totalComputations: 0,
    successRate: 0,
    averageSpeedup: 0,
    quantumAdvantageAchieved: 0
  },
  loading: false,
  error: null
};

export const submitQuantumComputation = createAsyncThunk(
  'quantum/submitComputation',
  async (computationData: { type: QuantumComputation['type']; inputData: any }) => {
    const response = await fetch('/api/quantum/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(computationData)
    });
    return response.json();
  }
);

export const optimizeWasteFlow = createAsyncThunk(
  'quantum/optimizeWasteFlow',
  async (optimizationData: { 
    wasteStreams: any[]; 
    constraints: Record<string, any>; 
    objectives: string[] 
  }) => {
    const response = await fetch('/api/quantum/optimize-waste-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optimizationData)
    });
    return response.json();
  }
);

export const generateQuantumPredictions = createAsyncThunk(
  'quantum/generatePredictions',
  async (predictionData: {
    predictionType: QuantumPrediction['predictionType'];
    timeHorizon: QuantumPrediction['timeHorizon'];
    inputData: any;
  }) => {
    const response = await fetch('/api/quantum/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(predictionData)
    });
    return response.json();
  }
);

export const runDigitalTwinSimulation = createAsyncThunk(
  'quantum/runSimulation',
  async (simulationData: {
    twinId: string;
    simulationType: DigitalTwinSimulation['simulationType'];
    parameters: Record<string, any>;
  }) => {
    const response = await fetch('/api/quantum/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simulationData)
    });
    return response.json();
  }
);

export const getQuantumResources = createAsyncThunk(
  'quantum/getResources',
  async () => {
    const response = await fetch('/api/quantum/resources');
    return response.json();
  }
);

export const getPerformanceMetrics = createAsyncThunk(
  'quantum/getPerformanceMetrics',
  async () => {
    const response = await fetch('/api/quantum/metrics');
    return response.json();
  }
);

export const cancelComputation = createAsyncThunk(
  'quantum/cancelComputation',
  async (computationId: string) => {
    const response = await fetch(`/api/quantum/compute/${computationId}/cancel`, {
      method: 'POST'
    });
    return response.json();
  }
);

const quantumSlice = createSlice({
  name: 'quantum',
  initialState,
  reducers: {
    updateComputationStatus(state, action: PayloadAction<{ computationId: string; status: QuantumComputation['status']; result?: any }>) {
      const computation = state.computations.find(c => c.computationId === action.payload.computationId);
      if (computation) {
        computation.status = action.payload.status;
        if (action.payload.result) {
          computation.result = action.payload.result;
          computation.endTime = new Date().toISOString();
        }
      }
    },
    clearError(state) {
      state.error = null;
    },
    setCurrentComputation(state, action: PayloadAction<QuantumComputation | null>) {
      state.currentComputation = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitQuantumComputation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitQuantumComputation.fulfilled, (state, action) => {
        state.loading = false;
        state.computations.push(action.payload);
        state.currentComputation = action.payload;
      })
      .addCase(submitQuantumComputation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit quantum computation';
      })
      .addCase(optimizeWasteFlow.fulfilled, (state, action) => {
        state.computations.push(action.payload.computation);
        // Store optimization result separately if needed
      })
      .addCase(generateQuantumPredictions.fulfilled, (state, action) => {
        state.predictions.push(action.payload);
      })
      .addCase(runDigitalTwinSimulation.fulfilled, (state, action) => {
        state.simulations.push(action.payload);
      })
      .addCase(getQuantumResources.fulfilled, (state, action) => {
        state.quantumResources = action.payload;
      })
      .addCase(getPerformanceMetrics.fulfilled, (state, action) => {
        state.performanceMetrics = action.payload;
      })
      .addCase(cancelComputation.fulfilled, (state, action) => {
        const computation = state.computations.find(c => c.computationId === action.payload.computationId);
        if (computation) {
          computation.status = 'failed';
          computation.endTime = new Date().toISOString();
        }
      });
  }
});

export const { updateComputationStatus, clearError, setCurrentComputation } = quantumSlice.actions;

export default quantumSlice.reducer;