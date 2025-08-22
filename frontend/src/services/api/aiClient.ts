// AI Services API Client
import { BaseApiClient, ApiConfig } from './baseClient';

// AI Service Types
export interface WasteAnalysisRequest {
  visualData?: string; // base64 encoded image
  spectralData?: any;
  weightData?: any;
  chemicalData?: any;
  analysisMode?: 'single' | 'multi';
}

export interface WasteAnalysisResult {
  id: string;
  classification: string;
  confidence: number;
  materialComposition: Record<string, number>;
  contaminationLevel: number;
  processingRecommendations: string[];
  valueEstimate: number;
  carbonFootprint: number;
  sensorContributions: Record<string, number>;
  qualityScore: number;
  timestamp: string;
}

export interface ContaminationDetectionRequest {
  imageData: string; // base64 encoded image
  expectedMaterialType: string;
  sensitivity?: 'low' | 'medium' | 'high';
}

export interface ContaminationLocation {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  type: string;
}

export interface ContaminationResult {
  id: string;
  contaminationDetected: boolean;
  confidence: number;
  severityLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  affectedAreaPercentage: number;
  qualityDegradation: number;
  economicImpact: number;
  contaminationTypes: string[];
  contaminationLocations: ContaminationLocation[];
  remediationSuggestions: string[];
  timestamp: string;
}

export interface RareMaterilaDetectionRequest {
  imageData: string;
  sensorData?: any;
  detectionThreshold?: number;
}

export interface RareMaterialResult {
  id: string;
  materialsDetected: Array<{
    material: string;
    confidence: number;
    quantity: number;
    location: ContaminationLocation;
    value: number;
  }>;
  totalValue: number;
  handlingInstructions: string[];
  timestamp: string;
}

export interface SensorCalibrationRequest {
  sensorIds: string[];
  calibrationType?: 'basic' | 'advanced';
}

export interface SensorCalibrationResult {
  calibrationId: string;
  sensorStatuses: Record<string, 'calibrated' | 'pending' | 'failed'>;
  calibrationData: Record<string, any>;
  timestamp: string;
}

export interface RealTimeDataResponse {
  throughput: number;
  efficiency: number;
  qualityScore: number;
  energyConsumption: number;
  sensorReadings: Array<{
    sensorId: string;
    type: string;
    value: any;
    timestamp: string;
  }>;
  systemStatus: 'operational' | 'warning' | 'error';
  lastUpdated: string;
}

export class AiApiClient extends BaseApiClient {
  constructor(config: Omit<ApiConfig, 'baseURL'> & { baseURL?: string } = {}) {
    super({
      baseURL: config.baseURL || process.env.REACT_APP_AI_API_URL || 'http://localhost:8001/api',
      ...config,
    });
  }

  // Waste Analysis
  async analyzeWaste(request: WasteAnalysisRequest): Promise<WasteAnalysisResult> {
    return this.post<WasteAnalysisResult>('/waste-analysis/analyze', request);
  }

  async getAnalysisHistory(limit = 50, offset = 0): Promise<{
    results: WasteAnalysisResult[];
    total: number;
    hasMore: boolean;
  }> {
    return this.get(`/waste-analysis/history?limit=${limit}&offset=${offset}`);
  }

  async getAnalysisById(id: string): Promise<WasteAnalysisResult> {
    return this.get<WasteAnalysisResult>(`/waste-analysis/${id}`);
  }

  // Contamination Detection
  async detectContamination(request: ContaminationDetectionRequest): Promise<ContaminationResult> {
    return this.post<ContaminationResult>('/contamination/detect', request);
  }

  async getContaminationHistory(limit = 50, offset = 0): Promise<{
    results: ContaminationResult[];
    total: number;
    hasMore: boolean;
  }> {
    return this.get(`/contamination/history?limit=${limit}&offset=${offset}`);
  }

  async flagBatch(batchId: string, contaminationResult: ContaminationResult): Promise<{
    success: boolean;
    flagId: string;
  }> {
    return this.post('/contamination/flag-batch', {
      batchId,
      contaminationResult,
    });
  }

  async getFlaggedBatches(): Promise<Array<{
    batchId: string;
    flagId: string;
    contaminationResult: ContaminationResult;
    flaggedAt: string;
    status: 'pending' | 'reviewed' | 'resolved';
  }>> {
    return this.get('/contamination/flagged-batches');
  }

  // Rare Material Detection
  async detectRareMaterials(request: RareMaterilaDetectionRequest): Promise<RareMaterialResult> {
    return this.post<RareMaterialResult>('/rare-materials/detect', request);
  }

  async getRareMaterialHistory(limit = 50, offset = 0): Promise<{
    results: RareMaterialResult[];
    total: number;
    hasMore: boolean;
  }> {
    return this.get(`/rare-materials/history?limit=${limit}&offset=${offset}`);
  }

  // Sensor Management
  async calibrateSensors(request: SensorCalibrationRequest): Promise<SensorCalibrationResult> {
    return this.post<SensorCalibrationResult>('/sensors/calibrate', request);
  }

  async getSensorStatus(): Promise<Record<string, {
    status: 'online' | 'offline' | 'calibrating' | 'error';
    lastCalibrated: string;
    accuracy: number;
    health: number;
  }>> {
    return this.get('/sensors/status');
  }

  async getRealTimeData(): Promise<RealTimeDataResponse> {
    return this.get<RealTimeDataResponse>('/real-time/data');
  }

  // Processing Parameters
  async getProcessingParameters(): Promise<Record<string, any>> {
    return this.get('/processing/parameters');
  }

  async updateProcessingParameters(parameters: Record<string, any>): Promise<{
    success: boolean;
    updatedParameters: Record<string, any>;
  }> {
    return this.put('/processing/parameters', parameters);
  }

  async optimizeParameters(targetMetrics: Record<string, number>): Promise<{
    optimizedParameters: Record<string, any>;
    expectedImprovement: Record<string, number>;
    confidence: number;
  }> {
    return this.post('/processing/optimize', { targetMetrics });
  }
}