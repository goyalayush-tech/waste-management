import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface SensorData {
  sensorType: 'visual' | 'spectral' | 'weight' | 'chemical';
  data: any;
  timestamp: string;
  confidence: number;
  calibrationStatus: string;
  sensorId: string;
}

export interface WasteAnalysisResult {
  classification: string;
  confidence: number;
  materialComposition: Record<string, number>;
  contaminationLevel: number;
  processingRecommendations: string[];
  valueEstimate: number;
  carbonFootprint: number;
  sensorContributions: Record<string, number>;
  qualityScore: number;
}

export interface MultiModalAnalysisRequest {
  visualData?: string; // base64 encoded image
  spectralData?: any;
  weightData?: any;
  chemicalData?: any;
}

interface WasteAnalysisState {
  currentAnalysis: WasteAnalysisResult | null;
  analysisHistory: WasteAnalysisResult[];
  sensorData: SensorData[];
  loading: boolean;
  error: string | null;
  calibrationStatus: Record<string, string>;
  realTimeData: {
    throughput: number;
    efficiency: number;
    qualityScore: number;
    energyConsumption: number;
  };
}

const initialState: WasteAnalysisState = {
  currentAnalysis: null,
  analysisHistory: [],
  sensorData: [],
  loading: false,
  error: null,
  calibrationStatus: {},
  realTimeData: {
    throughput: 0,
    efficiency: 0,
    qualityScore: 0,
    energyConsumption: 0
  }
};

export const analyzeWasteMultiModal = createAsyncThunk(
  'wasteAnalysis/analyzeMultiModal',
  async (request: MultiModalAnalysisRequest) => {
    const response = await axios.post('/api/waste-analysis/multi-modal', request);
    return response.data;
  }
);

export const calibrateSensors = createAsyncThunk(
  'wasteAnalysis/calibrateSensors',
  async (sensorIds: string[]) => {
    const response = await axios.post('/api/waste-analysis/calibrate', { sensorIds });
    return response.data;
  }
);

export const getRealTimeData = createAsyncThunk(
  'wasteAnalysis/getRealTimeData',
  async () => {
    const response = await axios.get('/api/waste-analysis/real-time');
    return response.data;
  }
);

const wasteAnalysisSlice = createSlice({
  name: 'wasteAnalysis',
  initialState,
  reducers: {
    addSensorData(state, action: PayloadAction<SensorData>) {
      state.sensorData.push(action.payload);
      // Keep only last 100 sensor readings
      if (state.sensorData.length > 100) {
        state.sensorData = state.sensorData.slice(-100);
      }
    },
    clearCurrentAnalysis(state) {
      state.currentAnalysis = null;
    },
    clearError(state) {
      state.error = null;
    },
    updateCalibrationStatus(state, action: PayloadAction<{ sensorId: string; status: string }>) {
      state.calibrationStatus[action.payload.sensorId] = action.payload.status;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeWasteMultiModal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeWasteMultiModal.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnalysis = action.payload;
        state.analysisHistory.push(action.payload);
      })
      .addCase(analyzeWasteMultiModal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to analyze waste';
      })
      .addCase(calibrateSensors.fulfilled, (state, action) => {
        Object.assign(state.calibrationStatus, action.payload);
      })
      .addCase(getRealTimeData.fulfilled, (state, action) => {
        state.realTimeData = action.payload;
      });
  }
});

export const { addSensorData, clearCurrentAnalysis, clearError, updateCalibrationStatus } = wasteAnalysisSlice.actions;

export default wasteAnalysisSlice.reducer;