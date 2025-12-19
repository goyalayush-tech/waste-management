import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Claim, ClaimStatus } from '../../features/claimclean/types';

interface ClaimCleanState {
  claims: Claim[];
  currentClaim: Claim | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: ClaimStatus | '';
    brand: string;
    recycler: string;
    scoreRange: [number, number];
    dateRange: [string, string] | null;
  };
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}

const initialState: ClaimCleanState = {
  claims: [],
  currentClaim: null,
  loading: false,
  error: null,
  filters: {
    status: '',
    brand: '',
    recycler: '',
    scoreRange: [0, 100],
    dateRange: null,
  },
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
};

// Async thunks for API operations
export const fetchClaims = createAsyncThunk(
  'claimclean/fetchClaims',
  async (params?: { page?: number; filters?: any }) => {
    // This will be connected to actual API later
    // For now, return mock data
    const mockResponse = {
      data: [],
      total: 0,
      page: params?.page || 1,
    };
    return mockResponse;
  }
);

export const fetchClaimById = createAsyncThunk<Claim | null, string>(
  'claimclean/fetchClaimById',
  async (_claimId: string) => {
    // This will be connected to actual API later
    const mockClaim: Claim | null = null;
    return mockClaim;
  }
);

export const createClaim = createAsyncThunk<Claim | null, Partial<Claim>>(
  'claimclean/createClaim',
  async (_claimData: Partial<Claim>) => {
    // This will be connected to actual API later
    const mockCreatedClaim: Claim | null = null;
    return mockCreatedClaim;
  }
);

export const updateClaim = createAsyncThunk<Claim | null, { claimId: string; updates: Partial<Claim> }>(
  'claimclean/updateClaim',
  async (_params: { claimId: string; updates: Partial<Claim> }) => {
    // This will be connected to actual API later
    const mockUpdatedClaim: Claim | null = null;
    return mockUpdatedClaim;
  }
);

export const runAudit = createAsyncThunk(
  'claimclean/runAudit',
  async (claimId: string) => {
    // This will be connected to actual API later
    const mockAuditResult = {
      score: 75,
      issues: [],
      reportHash: '0xabc123...',
    };
    return { claimId, result: mockAuditResult };
  }
);

const claimCleanSlice = createSlice({
  name: 'claimclean',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ClaimCleanState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentClaim: (state, action: PayloadAction<Claim | null>) => {
      state.currentClaim = action.payload;
    },
    updateClaimStatus: (state, action: PayloadAction<{ claimId: string; status: ClaimStatus }>) => {
      const claim = state.claims.find(c => c._id === action.payload.claimId);
      if (claim) {
        claim.status = action.payload.status;
      }
    },
    setPagination: (state, action: PayloadAction<Partial<ClaimCleanState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch claims
      .addCase(fetchClaims.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.loading = false;
        state.claims = action.payload.data;
        state.pagination.total = action.payload.total;
        state.pagination.current = action.payload.page;
      })
      .addCase(fetchClaims.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch claims';
      })
      
      // Fetch claim by ID
      .addCase(fetchClaimById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClaimById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClaim = action.payload;
      })
      .addCase(fetchClaimById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch claim';
      })
      
      // Create claim
      .addCase(createClaim.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClaim.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.claims.unshift(action.payload);
          state.currentClaim = action.payload;
        }
      })
      .addCase(createClaim.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create claim';
      })
      
      // Update claim
      .addCase(updateClaim.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.claims.findIndex(c => c._id === action.payload!._id);
          if (index !== -1) {
            state.claims[index] = action.payload;
          }
          if (state.currentClaim?._id === action.payload._id) {
            state.currentClaim = action.payload;
          }
        }
      })
      
      // Run audit
      .addCase(runAudit.fulfilled, (state, action) => {
        const { claimId, result } = action.payload;
        const claim = state.claims.find(c => c._id === claimId);
        if (claim) {
          claim.audit = result;
          claim.status = 'auditing';
        }
        if (state.currentClaim?._id === claimId) {
          state.currentClaim.audit = result;
          state.currentClaim.status = 'auditing';
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setCurrentClaim,
  updateClaimStatus,
  setPagination,
  clearError,
} = claimCleanSlice.actions;

export default claimCleanSlice.reducer;