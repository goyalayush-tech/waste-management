import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BreadcrumbItem {
  title: string;
  path?: string;
}

interface NavigationState {
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  activeSubmenu?: string;
}

const initialState: NavigationState = {
  currentPath: '/',
  breadcrumbs: [],
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  activeSubmenu: undefined,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setCurrentPath: (state, action: PayloadAction<string>) => {
      state.currentPath = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<BreadcrumbItem[]>) => {
      state.breadcrumbs = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    setActiveSubmenu: (state, action: PayloadAction<string | undefined>) => {
      state.activeSubmenu = action.payload;
    },
  },
});

export const {
  setCurrentPath,
  setBreadcrumbs,
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileMenu,
  setMobileMenuOpen,
  setActiveSubmenu,
} = navigationSlice.actions;

export default navigationSlice.reducer;