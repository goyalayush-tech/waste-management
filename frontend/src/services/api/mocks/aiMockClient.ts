// AI Services Mock Client
import { 
  AiApiClient, 
  WasteAnalysisRequest, 
  WasteAnalysisResult,
  ContaminationDetectionRequest,
  ContaminationResult,
  RareMaterilaDetectionRequest,
  RareMaterialResult,
  SensorCalibrationRequest,
  SensorCalibrationResult,
  RealTimeDataResponse
} from '../aiClient';

// Mock data generators
const generateMockAnalysisResult = (request: WasteAnalysisRequest): WasteAnalysisResult => ({
  id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  classification: ['Plastic', 'Metal', 'Paper', 'Glass', 'Organic'][Math.floor(Math.random() * 5)],
  confidence: 0.85 + Math.random() * 0.14, // 85-99%
  materialComposition: {
    'PET Plastic': Math.random() * 40,
    'Aluminum': Math.random() * 30,
    'Cardboard': Math.random() * 20,
    'Glass': Math.random() * 10,
  },
  contaminationLevel: Math.random() * 0.1, // 0-10%
  processingRecommendations: [
    'Sort by material type',
    'Remove contaminated items',
    'Clean before processing',
    'Check for rare materials'
  ],
  valueEstimate: Math.random() * 100 + 50, // $50-150
  carbonFootprint: Math.random() * 5 + 2, // 2-7 kg CO2
  sensorContributions: {
    visual: 0.4,
    spectral: 0.3,
    weight: 0.2,
    chemical: 0.1,
  },
  qualityScore: Math.floor(Math.random() * 20) + 80, // 80-100
  timestamp: new Date().toISOString(),
});

const generateMockContaminationResult = (request: ContaminationDetectionRequest): ContaminationResult => ({
  id: `contamination_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  contaminationDetected: Math.random() > 0.7, // 30% chance of contamination
  confidence: 0.8 + Math.random() * 0.19, // 80-99%
  severityLevel: ['none', 'low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 5)] as any,
  affectedAreaPercentage: Math.random() * 25, // 0-25%
  qualityDegradation: Math.random() * 0.3, // 0-30%
  economicImpact: Math.random() * 500, // $0-500
  contaminationTypes: ['food_waste', 'chemical_residue', 'foreign_material'],
  contaminationLocations: [
    {
      x: Math.random() * 800,
      y: Math.random() * 600,
      width: Math.random() * 100 + 50,
      height: Math.random() * 100 + 50,
      confidence: Math.random() * 0.3 + 0.7,
      type: 'food_waste'
    }
  ],
  remediationSuggestions: [
    'Remove contaminated items manually',
    'Increase sorting precision',
    'Implement additional cleaning step',
    'Review supplier quality standards'
  ],
  timestamp: new Date().toISOString(),
});

const generateMockRareMaterialResult = (request: RareMaterilaDetectionRequest): RareMaterialResult => ({
  id: `rare_material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  materialsDetected: [
    {
      material: 'Lithium',
      confidence: 0.92,
      quantity: Math.random() * 10,
      location: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        width: 50,
        height: 50,
        confidence: 0.92,
        type: 'lithium'
      },
      value: Math.random() * 1000 + 500
    }
  ],
  totalValue: Math.random() * 2000 + 1000,
  handlingInstructions: [
    'Handle with protective equipment',
    'Store in designated rare material container',
    'Document extraction process',
    'Notify rare material specialist'
  ],
  timestamp: new Date().toISOString(),
});

export class AiMockClient extends AiApiClient {
  constructor() {
    super({ useMock: true });
  }

  async analyzeWaste(request: WasteAnalysisRequest): Promise<WasteAnalysisResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    return generateMockAnalysisResult(request);
  }

  async getAnalysisHistory(limit = 50, offset = 0): Promise<{
    results: WasteAnalysisResult[];
    total: number;
    hasMore: boolean;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockResults = Array.from({ length: Math.min(limit, 20) }, () => 
      generateMockAnalysisResult({ visualData: 'mock_data' })
    );
    
    return {
      results: mockResults,
      total: 150,
      hasMore: offset + limit < 150,
    };
  }

  async getAnalysisById(id: string): Promise<WasteAnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockAnalysisResult({ visualData: 'mock_data' });
  }

  async detectContamination(request: ContaminationDetectionRequest): Promise<ContaminationResult> {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
    return generateMockContaminationResult(request);
  }

  async getContaminationHistory(limit = 50, offset = 0): Promise<{
    results: ContaminationResult[];
    total: number;
    hasMore: boolean;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockResults = Array.from({ length: Math.min(limit, 15) }, () => 
      generateMockContaminationResult({ imageData: 'mock_data', expectedMaterialType: 'mixed' })
    );
    
    return {
      results: mockResults,
      total: 75,
      hasMore: offset + limit < 75,
    };
  }

  async flagBatch(batchId: string, contaminationResult: ContaminationResult): Promise<{
    success: boolean;
    flagId: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      flagId: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async getFlaggedBatches(): Promise<Array<{
    batchId: string;
    flagId: string;
    contaminationResult: ContaminationResult;
    flaggedAt: string;
    status: 'pending' | 'reviewed' | 'resolved';
  }>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return Array.from({ length: 5 }, (_, i) => ({
      batchId: `BATCH_${Date.now() - i * 86400000}`,
      flagId: `flag_${Date.now() - i * 86400000}`,
      contaminationResult: generateMockContaminationResult({ 
        imageData: 'mock_data', 
        expectedMaterialType: 'mixed' 
      }),
      flaggedAt: new Date(Date.now() - i * 86400000).toISOString(),
      status: ['pending', 'reviewed', 'resolved'][Math.floor(Math.random() * 3)] as any,
    }));
  }

  async detectRareMaterials(request: RareMaterilaDetectionRequest): Promise<RareMaterialResult> {
    await new Promise(resolve => setTimeout(resolve, 1800 + Math.random() * 800));
    return generateMockRareMaterialResult(request);
  }

  async getRareMaterialHistory(limit = 50, offset = 0): Promise<{
    results: RareMaterialResult[];
    total: number;
    hasMore: boolean;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockResults = Array.from({ length: Math.min(limit, 8) }, () => 
      generateMockRareMaterialResult({ imageData: 'mock_data' })
    );
    
    return {
      results: mockResults,
      total: 25,
      hasMore: offset + limit < 25,
    };
  }

  async calibrateSensors(request: SensorCalibrationRequest): Promise<SensorCalibrationResult> {
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    
    const sensorStatuses: Record<string, 'calibrated' | 'pending' | 'failed'> = {};
    request.sensorIds.forEach(sensorId => {
      sensorStatuses[sensorId] = Math.random() > 0.1 ? 'calibrated' : 'failed';
    });
    
    return {
      calibrationId: `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sensorStatuses,
      calibrationData: {
        accuracy: 0.95 + Math.random() * 0.04,
        precision: 0.92 + Math.random() * 0.07,
        drift: Math.random() * 0.02,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getSensorStatus(): Promise<Record<string, {
    status: 'online' | 'offline' | 'calibrating' | 'error';
    lastCalibrated: string;
    accuracy: number;
    health: number;
  }>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      'visual_1': {
        status: 'online',
        lastCalibrated: new Date(Date.now() - 86400000).toISOString(),
        accuracy: 0.96,
        health: 0.98,
      },
      'spectral_1': {
        status: 'online',
        lastCalibrated: new Date(Date.now() - 172800000).toISOString(),
        accuracy: 0.94,
        health: 0.95,
      },
      'weight_1': {
        status: 'calibrating',
        lastCalibrated: new Date(Date.now() - 259200000).toISOString(),
        accuracy: 0.92,
        health: 0.97,
      },
      'chemical_1': {
        status: 'online',
        lastCalibrated: new Date(Date.now() - 86400000).toISOString(),
        accuracy: 0.89,
        health: 0.93,
      },
    };
  }

  async getRealTimeData(): Promise<RealTimeDataResponse> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      throughput: Math.floor(Math.random() * 50) + 100, // 100-150 items/hr
      efficiency: Math.floor(Math.random() * 10) + 90, // 90-100%
      qualityScore: Math.floor(Math.random() * 15) + 85, // 85-100
      energyConsumption: Math.floor(Math.random() * 20) + 80, // 80-100 kWh
      sensorReadings: [
        {
          sensorId: 'visual_1',
          type: 'camera',
          value: { fps: 30, resolution: '1920x1080', exposure: 'auto' },
          timestamp: new Date().toISOString(),
        },
        {
          sensorId: 'spectral_1',
          type: 'spectrometer',
          value: { wavelength: 550, intensity: 0.75 },
          timestamp: new Date().toISOString(),
        },
      ],
      systemStatus: Math.random() > 0.8 ? 'warning' : 'operational',
      lastUpdated: new Date().toISOString(),
    };
  }

  async getProcessingParameters(): Promise<Record<string, any>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      sortingSpeed: 150,
      qualityThreshold: 0.85,
      contaminationTolerance: 0.05,
      energyEfficiencyMode: true,
      autoCalibration: true,
    };
  }

  async updateProcessingParameters(parameters: Record<string, any>): Promise<{
    success: boolean;
    updatedParameters: Record<string, any>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      updatedParameters: parameters,
    };
  }

  async optimizeParameters(targetMetrics: Record<string, number>): Promise<{
    optimizedParameters: Record<string, any>;
    expectedImprovement: Record<string, number>;
    confidence: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      optimizedParameters: {
        sortingSpeed: 165,
        qualityThreshold: 0.88,
        contaminationTolerance: 0.03,
      },
      expectedImprovement: {
        efficiency: 0.05,
        quality: 0.03,
        throughput: 0.08,
      },
      confidence: 0.87,
    };
  }
}