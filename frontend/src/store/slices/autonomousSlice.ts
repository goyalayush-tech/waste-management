import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ProcessingEquipment {
  equipmentId: string;
  name: string;
  type: 'sorting' | 'shredding' | 'cleaning' | 'melting' | 'compacting';
  status: 'idle' | 'running' | 'maintenance' | 'error';
  autonomyLevel: 'manual' | 'semi_autonomous' | 'fully_autonomous';
  currentParameters: ProcessingParameters;
  optimalParameters: ProcessingParameters;
  efficiency: number;
  throughput: number;
  energyConsumption: number;
  maintenanceSchedule: MaintenanceSchedule;
  lastUpdated: string;
}

export interface ProcessingParameters {
  temperature?: number;
  pressure?: number;
  speed?: number;
  duration?: number;
  power?: number;
  flowRate?: number;
}

export interface MaintenanceSchedule {
  nextMaintenance: string;
  maintenanceType: 'routine' | 'predictive' | 'emergency';
  estimatedDuration: number;
  requiredParts: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RLAgent {
  agentId: string;
  equipmentId: string;
  modelType: 'DQN' | 'PPO' | 'A3C' | 'SAC';
  trainingStatus: 'training' | 'deployed' | 'updating' | 'paused';
  performance: {
    episodeReward: number;
    averageReward: number;
    explorationRate: number;
    learningRate: number;
    trainingEpisodes: number;
  };
  safetyConstraints: SafetyConstraint[];
  lastAction: string;
  confidence: number;
}

export interface SafetyConstraint {
  constraintId: string;
  type: 'temperature_limit' | 'pressure_limit' | 'speed_limit' | 'emergency_stop';
  threshold: number;
  action: 'alert' | 'reduce_power' | 'emergency_stop' | 'maintenance_mode';
  isActive: boolean;
}

export interface ProcessingJob {
  jobId: string;
  wasteType: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  assignedEquipment: string[];
  estimatedDuration: number;
  actualDuration?: number;
  qualityScore?: number;
  energyUsed?: number;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentDistribution {
  distributionId: string;
  jobId: string;
  totalValue: number;
  contributors: {
    address: string;
    contribution: number;
    percentage: number;
    amount: number;
  }[];
  qualityBonus: number;
  efficiencyBonus: number;
  status: 'calculated' | 'pending' | 'distributed' | 'failed';
  transactionHash?: string;
  distributedAt?: string;
}

interface AutonomousState {
  equipment: ProcessingEquipment[];
  rlAgents: RLAgent[];
  processingJobs: ProcessingJob[];
  paymentDistributions: PaymentDistribution[];
  systemOverview: {
    totalEquipment: number;
    autonomousEquipment: number;
    averageEfficiency: number;
    totalThroughput: number;
    energyEfficiency: number;
    uptime: number;
  };
  selectedEquipment: ProcessingEquipment | null;
  selectedAgent: RLAgent | null;
  loading: boolean;
  error: string | null;
}

const initialState: AutonomousState = {
  equipment: [],
  rlAgents: [],
  processingJobs: [],
  paymentDistributions: [],
  systemOverview: {
    totalEquipment: 0,
    autonomousEquipment: 0,
    averageEfficiency: 0,
    totalThroughput: 0,
    energyEfficiency: 0,
    uptime: 0
  },
  selectedEquipment: null,
  selectedAgent: null,
  loading: false,
  error: null
};

export const deployRLAgent = createAsyncThunk(
  'autonomous/deployRLAgent',
  async (agentData: {
    equipmentId: string;
    modelType: RLAgent['modelType'];
    safetyConstraints: SafetyConstraint[];
  }) => {
    const response = await fetch('/api/autonomous/deploy-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData)
    });
    return response.json();
  }
);

export const optimizeProcessingParameters = createAsyncThunk(
  'autonomous/optimizeParameters',
  async (data: {
    equipmentId: string;
    wasteType: string;
    objectives: string[];
  }) => {
    const response = await fetch('/api/autonomous/optimize-parameters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export const createProcessingJob = createAsyncThunk(
  'autonomous/createJob',
  async (jobData: {
    wasteType: string;
    quantity: number;
    priority: ProcessingJob['priority'];
    requirements?: Record<string, any>;
  }) => {
    const response = await fetch('/api/autonomous/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    return response.json();
  }
);

export const executeAutonomousProcessing = createAsyncThunk(
  'autonomous/executeProcessing',
  async (data: {
    jobId: string;
    equipmentIds: string[];
    parameters?: ProcessingParameters;
  }) => {
    const response = await fetch('/api/autonomous/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export const calculatePaymentDistribution = createAsyncThunk(
  'autonomous/calculatePayment',
  async (jobId: string) => {
    const response = await fetch(`/api/autonomous/jobs/${jobId}/payment`, {
      method: 'POST'
    });
    return response.json();
  }
);

export const distributePayments = createAsyncThunk(
  'autonomous/distributePayments',
  async (distributionId: string) => {
    const response = await fetch(`/api/autonomous/payments/${distributionId}/distribute`, {
      method: 'POST'
    });
    return response.json();
  }
);

export const updateEquipmentParameters = createAsyncThunk(
  'autonomous/updateEquipmentParameters',
  async (data: {
    equipmentId: string;
    parameters: ProcessingParameters;
  }) => {
    const response = await fetch(`/api/autonomous/equipment/${data.equipmentId}/parameters`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameters: data.parameters })
    });
    return response.json();
  }
);

export const scheduleMaintenanceTask = createAsyncThunk(
  'autonomous/scheduleMaintenance',
  async (data: {
    equipmentId: string;
    maintenanceType: MaintenanceSchedule['maintenanceType'];
    scheduledTime: string;
  }) => {
    const response = await fetch('/api/autonomous/maintenance/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export const getSystemOverview = createAsyncThunk(
  'autonomous/getSystemOverview',
  async () => {
    const response = await fetch('/api/autonomous/overview');
    return response.json();
  }
);

const autonomousSlice = createSlice({
  name: 'autonomous',
  initialState,
  reducers: {
    setSelectedEquipment(state, action: PayloadAction<ProcessingEquipment | null>) {
      state.selectedEquipment = action.payload;
    },
    setSelectedAgent(state, action: PayloadAction<RLAgent | null>) {
      state.selectedAgent = action.payload;
    },
    updateEquipmentStatus(state, action: PayloadAction<{ equipmentId: string; status: ProcessingEquipment['status'] }>) {
      const equipment = state.equipment.find(e => e.equipmentId === action.payload.equipmentId);
      if (equipment) {
        equipment.status = action.payload.status;
        equipment.lastUpdated = new Date().toISOString();
      }
    },
    updateJobStatus(state, action: PayloadAction<{ jobId: string; status: ProcessingJob['status']; completedAt?: string }>) {
      const job = state.processingJobs.find(j => j.jobId === action.payload.jobId);
      if (job) {
        job.status = action.payload.status;
        if (action.payload.completedAt) {
          job.completedAt = action.payload.completedAt;
        }
      }
    },
    updateAgentPerformance(state, action: PayloadAction<{ agentId: string; performance: Partial<RLAgent['performance']> }>) {
      const agent = state.rlAgents.find(a => a.agentId === action.payload.agentId);
      if (agent) {
        agent.performance = { ...agent.performance, ...action.payload.performance };
      }
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(deployRLAgent.fulfilled, (state, action) => {
        state.rlAgents.push(action.payload);
        // Update equipment autonomy level
        const equipment = state.equipment.find(e => e.equipmentId === action.payload.equipmentId);
        if (equipment) {
          equipment.autonomyLevel = 'fully_autonomous';
        }
      })
      .addCase(optimizeProcessingParameters.fulfilled, (state, action) => {
        const equipment = state.equipment.find(e => e.equipmentId === action.payload.equipmentId);
        if (equipment) {
          equipment.optimalParameters = action.payload.parameters;
          equipment.efficiency = action.payload.expectedEfficiency;
        }
      })
      .addCase(createProcessingJob.fulfilled, (state, action) => {
        state.processingJobs.push(action.payload);
      })
      .addCase(executeAutonomousProcessing.fulfilled, (state, action) => {
        const job = state.processingJobs.find(j => j.jobId === action.payload.jobId);
        if (job) {
          job.status = 'processing';
          job.assignedEquipment = action.payload.assignedEquipment;
        }
      })
      .addCase(calculatePaymentDistribution.fulfilled, (state, action) => {
        state.paymentDistributions.push(action.payload);
      })
      .addCase(distributePayments.fulfilled, (state, action) => {
        const distribution = state.paymentDistributions.find(d => d.distributionId === action.payload.distributionId);
        if (distribution) {
          distribution.status = 'distributed';
          distribution.transactionHash = action.payload.transactionHash;
          distribution.distributedAt = action.payload.distributedAt;
        }
      })
      .addCase(updateEquipmentParameters.fulfilled, (state, action) => {
        const equipment = state.equipment.find(e => e.equipmentId === action.payload.equipmentId);
        if (equipment) {
          equipment.currentParameters = action.payload.parameters;
          equipment.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(scheduleMaintenanceTask.fulfilled, (state, action) => {
        const equipment = state.equipment.find(e => e.equipmentId === action.payload.equipmentId);
        if (equipment) {
          equipment.maintenanceSchedule = action.payload.maintenanceSchedule;
        }
      })
      .addCase(getSystemOverview.fulfilled, (state, action) => {
        state.systemOverview = action.payload;
      });
  }
});

export const { 
  setSelectedEquipment, 
  setSelectedAgent, 
  updateEquipmentStatus, 
  updateJobStatus, 
  updateAgentPerformance, 
  clearError 
} = autonomousSlice.actions;

export default autonomousSlice.reducer;