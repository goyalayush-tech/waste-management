import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { aiClient } from '../../services/api';

export enum ContaminationType {
  ORGANIC_IN_PLASTIC = "organic_in_plastic",
  METAL_IN_PLASTIC = "metal_in_plastic",
  GLASS_IN_PLASTIC = "glass_in_plastic",
  PAPER_IN_PLASTIC = "paper_in_plastic",
  PLASTIC_IN_ORGANIC = "plastic_in_organic",
  METAL_IN_ORGANIC = "metal_in_organic",
  GLASS_IN_ORGANIC = "glass_in_organic",
  HAZARDOUS_IN_GENERAL = "hazardous_in_general",
  LIQUID_CONTAMINATION = "liquid_contamination",
  CHEMICAL_CONTAMINATION = "chemical_contamination",
  BIOLOGICAL_CONTAMINATION = "biological_contamination",
  CROSS_CONTAMINATION = "cross_contamination"
}

export enum ContaminationSeverity {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface ContaminationLocation {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RemediationAction {
  actionType: string;
  description: string;
  estimatedCost: number;
  estimatedTime: number;
  successProbability: number;
  equipmentRequired: string[];
  safetyRequirements: string[];
}

export interface ContaminationResult {
  contaminationDetected: boolean;
  contaminationTypes: ContaminationType[];
  severityLevel: ContaminationSeverity;
  confidence: number;
  affectedAreaPercentage: number;
  contaminationLocations: ContaminationLocation[];
  remediationSuggestions: string[];
  processingImpact: Record<string, any>;
  qualityDegradation: number;
  economicImpact: number;
}

export interface ContaminationDetectionRequest {
  imageData: string; // base64 encoded image
  spectralData?: any;
  chemicalData?: any;
  expectedMaterialType?: string;
}

interface ContaminationState {
  currentResult: ContaminationResult | null;
  detectionHistory: ContaminationResult[];
  remediationActions: RemediationAction[];
  loading: boolean;
  error: string | null;
  selectedContaminationType: ContaminationType | null;
  flaggedBatches: {
    batchId: string;
    contaminationResult: ContaminationResult;
    timestamp: string;
    status: 'pending' | 'remediated' | 'rejected';
  }[];
}

const initialState: ContaminationState = {
  currentResult: null,
  detectionHistory: [],
  remediationActions: [],
  loading: false,
  error: null,
  selectedContaminationType: null,
  flaggedBatches: []
};

export const detectContamination = createAsyncThunk(
  'contamination/detect',
  async (request: ContaminationDetectionRequest) => {
    return await aiClient().detectContamination(request);
  }
);

export const getRemediationActions = createAsyncThunk(
  'contamination/getRemediationActions',
  async (contaminationResult: ContaminationResult) => {
    // For now, return the suggestions from the contamination result
    // In the future, this could call a separate remediation API
    return contaminationResult.remediationSuggestions.map((suggestion, index) => ({
      actionType: 'manual',
      description: suggestion,
      estimatedCost: Math.random() * 100 + 50,
      estimatedTime: Math.random() * 60 + 30,
      successProbability: Math.random() * 0.3 + 0.7,
      equipmentRequired: ['protective_gear', 'sorting_tools'],
      safetyRequirements: ['wear_gloves', 'eye_protection']
    }));
  }
);

export const flagBatch = createAsyncThunk(
  'contamination/flagBatch',
  async (data: { batchId: string, contaminationResult: ContaminationResult }) => {
    await aiClient().flagBatch(data.batchId, data.contaminationResult);
    return data;
  }
);

export const updateBatchStatus = createAsyncThunk(
  'contamination/updateBatchStatus',
  async (data: { batchId: string, status: 'pending' | 'remediated' | 'rejected' }) => {
    // For now, just return the data since we don't have a specific API for this
    // In the future, this could call a batch management API
    return data;
  }
);

const contaminationSlice = createSlice({
  name: 'contamination',
  initialState,
  reducers: {
    setSelectedContaminationType(state, action: PayloadAction<ContaminationType | null>) {
      state.selectedContaminationType = action.payload;
    },
    clearCurrentResult(state) {
      state.currentResult = null;
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(detectContamination.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(detectContamination.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResult = action.payload;
        state.detectionHistory.push(action.payload);
      })
      .addCase(detectContamination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to detect contamination';
      })
      .addCase(getRemediationActions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRemediationActions.fulfilled, (state, action) => {
        state.loading = false;
        state.remediationActions = action.payload;
      })
      .addCase(getRemediationActions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get remediation actions';
      })
      .addCase(flagBatch.fulfilled, (state, action) => {
        state.flaggedBatches.push({
          batchId: action.payload.batchId,
          contaminationResult: action.payload.contaminationResult,
          timestamp: new Date().toISOString(),
          status: 'pending'
        });
      })
      .addCase(updateBatchStatus.fulfilled, (state, action) => {
        const index = state.flaggedBatches.findIndex(batch => batch.batchId === action.payload.batchId);
        if (index !== -1) {
          state.flaggedBatches[index].status = action.payload.status;
        }
      });
  }
});

export const { setSelectedContaminationType, clearCurrentResult, clearError } = contaminationSlice.actions;

export default contaminationSlice.reducer;