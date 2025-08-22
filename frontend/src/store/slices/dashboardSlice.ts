import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SystemStatistics {
  efficiency: number;
  wasteProcessed: number;
  contaminationRate: number;
  carbonCredits: number;
  activeUsers: number;
  systemUptime: number;
}

export interface DashboardWidget {
  id: string;
  type: 'status_card' | 'chart' | 'table' | 'quick_actions' | 'activity_feed' | 'alerts';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data: any;
  refreshInterval?: number;
  visible: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  color: string;
  description: string;
  usageCount?: number;
  isPinned?: boolean;
}

export interface WorkflowStep {
  id: string;
  label: string;
  route: string;
  description: string;
  icon: string;
}

export interface WorkflowShortcut {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  category: string;
  estimatedTime: string;
  isPinned: boolean;
  usageCount: number;
}

export interface UserPreferences {
  favoriteActions: string[];
  customShortcuts: QuickAction[];
  workflowPreferences: {
    autoStart: boolean;
    showEstimatedTime: boolean;
    groupByCategory: boolean;
  };
}

interface DashboardState {
  systemStats: SystemStatistics;
  widgets: DashboardWidget[];
  quickActions: QuickAction[];
  workflowShortcuts: WorkflowShortcut[];
  userPreferences: UserPreferences;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  systemStats: {
    efficiency: 94.2,
    wasteProcessed: 1247,
    contaminationRate: 2.3,
    carbonCredits: 156.7,
    activeUsers: 1234,
    systemUptime: 99.8,
  },
  widgets: [
    {
      id: 'system-efficiency',
      type: 'status_card',
      title: 'System Efficiency',
      size: 'small',
      position: { x: 0, y: 0 },
      data: { value: 94.2, unit: '%', trend: 'up' },
      visible: true,
    },
    {
      id: 'waste-processed',
      type: 'status_card',
      title: 'Waste Processed Today',
      size: 'small',
      position: { x: 1, y: 0 },
      data: { value: 1247, unit: 'kg', trend: 'up' },
      visible: true,
    },
    {
      id: 'contamination-rate',
      type: 'status_card',
      title: 'Contamination Rate',
      size: 'small',
      position: { x: 2, y: 0 },
      data: { value: 2.3, unit: '%', trend: 'down' },
      visible: true,
    },
    {
      id: 'carbon-credits',
      type: 'status_card',
      title: 'Carbon Credits',
      size: 'small',
      position: { x: 3, y: 0 },
      data: { value: 156.7, unit: 'tons CO₂', trend: 'up' },
      visible: true,
    },
  ],
  quickActions: [
    {
      id: 'start-analysis',
      label: 'Start Analysis',
      icon: 'ExperimentOutlined',
      route: '/waste-analysis',
      color: '#1890ff',
      description: 'Begin waste sample analysis',
    },
    {
      id: 'check-contamination',
      label: 'Check Contamination',
      icon: 'SafetyCertificateOutlined',
      route: '/contamination-detection',
      color: '#52c41a',
      description: 'Detect contamination in samples',
    },
    {
      id: 'view-certificates',
      label: 'View Certificates',
      icon: 'BlockOutlined',
      route: '/blockchain/certificates',
      color: '#722ed1',
      description: 'Access NFT certificates',
    },
    {
      id: 'system-analytics',
      label: 'Analytics',
      icon: 'LineChartOutlined',
      route: '/analytics',
      color: '#13c2c2',
      description: 'View system analytics',
    },
  ],
  workflowShortcuts: [
    {
      id: 'complete-analysis',
      name: 'Complete Waste Analysis',
      description: 'Full workflow from sample collection to report generation',
      steps: [
        {
          id: 'step-1',
          label: 'Start Analysis',
          route: '/waste-analysis',
          description: 'Begin waste sample analysis',
          icon: 'ExperimentOutlined',
        },
        {
          id: 'step-2',
          label: 'Check Results',
          route: '/waste-analysis/results',
          description: 'Review analysis results',
          icon: 'FileTextOutlined',
        },
        {
          id: 'step-3',
          label: 'Generate Certificate',
          route: '/blockchain/certificates',
          description: 'Create NFT certificate',
          icon: 'BlockOutlined',
        },
      ],
      category: 'Analysis',
      estimatedTime: '10-15 min',
      isPinned: false,
      usageCount: 0,
    },
    {
      id: 'contamination-workflow',
      name: 'Contamination Detection & Remediation',
      description: 'Detect contamination and implement remediation measures',
      steps: [
        {
          id: 'step-1',
          label: 'Detect Contamination',
          route: '/contamination-detection',
          description: 'Scan for contamination',
          icon: 'SafetyCertificateOutlined',
        },
        {
          id: 'step-2',
          label: 'Review Flagged Batches',
          route: '/contamination-detection/flagged',
          description: 'Check flagged items',
          icon: 'ExclamationCircleOutlined',
        },
        {
          id: 'step-3',
          label: 'Apply Remediation',
          route: '/contamination-detection/remediation',
          description: 'Implement fixes',
          icon: 'ToolOutlined',
        },
      ],
      category: 'Detection',
      estimatedTime: '5-8 min',
      isPinned: true,
      usageCount: 12,
    },
  ],
  userPreferences: {
    favoriteActions: ['start-analysis', 'check-contamination'],
    customShortcuts: [],
    workflowPreferences: {
      autoStart: false,
      showEstimatedTime: true,
      groupByCategory: true,
    },
  },
  loading: false,
  error: null,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateSystemStats: (state, action: PayloadAction<Partial<SystemStatistics>>) => {
      state.systemStats = { ...state.systemStats, ...action.payload };
      state.lastUpdated = new Date().toISOString();
    },
    addWidget: (state, action: PayloadAction<DashboardWidget>) => {
      state.widgets.push(action.payload);
    },
    removeWidget: (state, action: PayloadAction<string>) => {
      state.widgets = state.widgets.filter(widget => widget.id !== action.payload);
    },
    updateWidget: (state, action: PayloadAction<{ id: string; updates: Partial<DashboardWidget> }>) => {
      const { id, updates } = action.payload;
      const widgetIndex = state.widgets.findIndex(widget => widget.id === id);
      if (widgetIndex !== -1) {
        state.widgets[widgetIndex] = { ...state.widgets[widgetIndex], ...updates };
      }
    },
    reorderWidgets: (state, action: PayloadAction<DashboardWidget[]>) => {
      state.widgets = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addQuickAction: (state, action: PayloadAction<QuickAction>) => {
      state.quickActions.push(action.payload);
    },
    removeQuickAction: (state, action: PayloadAction<string>) => {
      state.quickActions = state.quickActions.filter(action => action.id !== action.payload);
    },
    updateQuickAction: (state, action: PayloadAction<{ id: string; updates: Partial<QuickAction> }>) => {
      const { id, updates } = action.payload;
      const actionIndex = state.quickActions.findIndex(action => action.id === id);
      if (actionIndex !== -1) {
        state.quickActions[actionIndex] = { ...state.quickActions[actionIndex], ...updates };
      }
    },
    addWorkflowShortcut: (state, action: PayloadAction<WorkflowShortcut>) => {
      state.workflowShortcuts.push(action.payload);
    },
    removeWorkflowShortcut: (state, action: PayloadAction<string>) => {
      state.workflowShortcuts = state.workflowShortcuts.filter(workflow => workflow.id !== action.payload);
    },
    updateWorkflowShortcut: (state, action: PayloadAction<{ id: string; updates: Partial<WorkflowShortcut> }>) => {
      const { id, updates } = action.payload;
      const workflowIndex = state.workflowShortcuts.findIndex(workflow => workflow.id === id);
      if (workflowIndex !== -1) {
        state.workflowShortcuts[workflowIndex] = { ...state.workflowShortcuts[workflowIndex], ...updates };
      }
    },
  },
});

export const {
  updateSystemStats,
  addWidget,
  removeWidget,
  updateWidget,
  reorderWidgets,
  setLoading,
  setError,
  addQuickAction,
  removeQuickAction,
  updateQuickAction,
  addWorkflowShortcut,
  removeWorkflowShortcut,
  updateWorkflowShortcut,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;