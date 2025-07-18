import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface VirtualFacility {
  facilityId: string;
  metaversePlatform: string;
  coordinates: { x: number; y: number; z: number };
  interactiveElements: InteractiveElement[];
  educationalContent: EducationalContent[];
  gamificationFeatures: GameFeature[];
  isActive: boolean;
  visitorsCount: number;
}

export interface InteractiveElement {
  elementId: string;
  type: 'sorting_station' | 'processing_unit' | 'information_panel' | 'mini_game';
  position: { x: number; y: number; z: number };
  isActive: boolean;
  interactionCount: number;
}

export interface EducationalContent {
  contentId: string;
  title: string;
  type: 'video' | '3d_model' | 'interactive_demo' | 'quiz';
  description: string;
  completionRate: number;
  averageRating: number;
}

export interface GameFeature {
  featureId: string;
  name: string;
  type: 'leaderboard' | 'achievement' | 'challenge' | 'reward_system';
  isActive: boolean;
  participantCount: number;
}

export interface GameSession {
  sessionId: string;
  player: string;
  gameType: 'waste_sorting' | 'facility_management' | 'recycling_challenge' | 'education_quest';
  virtualFacilityId: string;
  tasksCompleted: GameTask[];
  tokensEarned: number;
  nftsEarned: string[];
  educationalProgress: EducationalProgress;
  realWorldImpact: RealWorldImpact;
  startTime: string;
  endTime?: string;
  score: number;
}

export interface GameTask {
  taskId: string;
  name: string;
  description: string;
  type: 'sorting' | 'processing' | 'learning' | 'collaboration';
  completed: boolean;
  reward: number;
  completedAt?: string;
}

export interface EducationalProgress {
  modulesCompleted: number;
  totalModules: number;
  knowledgeScore: number;
  certificatesEarned: string[];
}

export interface RealWorldImpact {
  wasteProcessed: number;
  carbonSaved: number;
  recyclingEfficiency: number;
  communityContribution: number;
}

export interface VirtualAsset {
  assetId: string;
  owner: string;
  assetType: 'equipment' | 'decoration' | 'utility' | 'collectible';
  metaversePlatform: string;
  virtualCoordinates: { x: number; y: number; z: number };
  realWorldConnection?: string;
  interactivityLevel: number;
  educationalValue: number;
  gamificationFeatures: string[];
  nftRepresentation?: string;
  createdAt: string;
}

interface MetaverseState {
  virtualFacilities: VirtualFacility[];
  currentSession: GameSession | null;
  userSessions: GameSession[];
  virtualAssets: VirtualAsset[];
  leaderboard: {
    player: string;
    score: number;
    tokensEarned: number;
    rank: number;
  }[];
  achievements: {
    achievementId: string;
    name: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
  }[];
  educationalProgress: EducationalProgress;
  realWorldImpact: RealWorldImpact;
  loading: boolean;
  error: string | null;
  connectedPlatform: string | null;
}

const initialState: MetaverseState = {
  virtualFacilities: [],
  currentSession: null,
  userSessions: [],
  virtualAssets: [],
  leaderboard: [],
  achievements: [],
  educationalProgress: {
    modulesCompleted: 0,
    totalModules: 0,
    knowledgeScore: 0,
    certificatesEarned: []
  },
  realWorldImpact: {
    wasteProcessed: 0,
    carbonSaved: 0,
    recyclingEfficiency: 0,
    communityContribution: 0
  },
  loading: false,
  error: null,
  connectedPlatform: null
};

export const createVirtualFacility = createAsyncThunk(
  'metaverse/createVirtualFacility',
  async (facilityData: Omit<VirtualFacility, 'facilityId' | 'visitorsCount'>) => {
    const response = await fetch('/api/metaverse/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facilityData)
    });
    return response.json();
  }
);

export const startGameSession = createAsyncThunk(
  'metaverse/startGameSession',
  async (sessionData: { gameType: GameSession['gameType']; virtualFacilityId: string; player: string }) => {
    const response = await fetch('/api/metaverse/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    return response.json();
  }
);

export const completeTask = createAsyncThunk(
  'metaverse/completeTask',
  async (data: { sessionId: string; taskId: string }) => {
    const response = await fetch(`/api/metaverse/sessions/${data.sessionId}/tasks/${data.taskId}/complete`, {
      method: 'POST'
    });
    return response.json();
  }
);

export const endGameSession = createAsyncThunk(
  'metaverse/endGameSession',
  async (sessionId: string) => {
    const response = await fetch(`/api/metaverse/sessions/${sessionId}/end`, {
      method: 'POST'
    });
    return response.json();
  }
);

export const getLeaderboard = createAsyncThunk(
  'metaverse/getLeaderboard',
  async (gameType?: string) => {
    const url = gameType ? `/api/metaverse/leaderboard?gameType=${gameType}` : '/api/metaverse/leaderboard';
    const response = await fetch(url);
    return response.json();
  }
);

export const getUserAchievements = createAsyncThunk(
  'metaverse/getUserAchievements',
  async (userAddress: string) => {
    const response = await fetch(`/api/metaverse/achievements/${userAddress}`);
    return response.json();
  }
);

export const mintVirtualAsset = createAsyncThunk(
  'metaverse/mintVirtualAsset',
  async (assetData: Omit<VirtualAsset, 'assetId' | 'createdAt'>) => {
    const response = await fetch('/api/metaverse/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetData)
    });
    return response.json();
  }
);

export const syncRealToVirtual = createAsyncThunk(
  'metaverse/syncRealToVirtual',
  async (data: { realWorldData: any; virtualWorldId: string }) => {
    const response = await fetch('/api/metaverse/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

const metaverseSlice = createSlice({
  name: 'metaverse',
  initialState,
  reducers: {
    setConnectedPlatform(state, action: PayloadAction<string | null>) {
      state.connectedPlatform = action.payload;
    },
    updateEducationalProgress(state, action: PayloadAction<Partial<EducationalProgress>>) {
      state.educationalProgress = { ...state.educationalProgress, ...action.payload };
    },
    updateRealWorldImpact(state, action: PayloadAction<Partial<RealWorldImpact>>) {
      state.realWorldImpact = { ...state.realWorldImpact, ...action.payload };
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createVirtualFacility.fulfilled, (state, action) => {
        state.virtualFacilities.push(action.payload);
      })
      .addCase(startGameSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        if (state.currentSession) {
          const taskIndex = state.currentSession.tasksCompleted.findIndex(
            task => task.taskId === action.payload.taskId
          );
          if (taskIndex !== -1) {
            state.currentSession.tasksCompleted[taskIndex] = action.payload;
          } else {
            state.currentSession.tasksCompleted.push(action.payload);
          }
          state.currentSession.tokensEarned += action.payload.reward;
        }
      })
      .addCase(endGameSession.fulfilled, (state, action) => {
        if (state.currentSession) {
          state.userSessions.push({ ...state.currentSession, ...action.payload });
          state.currentSession = null;
        }
      })
      .addCase(getLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
      })
      .addCase(getUserAchievements.fulfilled, (state, action) => {
        state.achievements = action.payload;
      })
      .addCase(mintVirtualAsset.fulfilled, (state, action) => {
        state.virtualAssets.push(action.payload);
      });
  }
});

export const { 
  setConnectedPlatform, 
  updateEducationalProgress, 
  updateRealWorldImpact, 
  clearError 
} = metaverseSlice.actions;

export default metaverseSlice.reducer;