// Responsive utilities for consistent mobile/desktop layouts

export interface ResponsiveConfig {
  xs?: number; // < 576px
  sm?: number; // >= 576px
  md?: number; // >= 768px
  lg?: number; // >= 992px
  xl?: number; // >= 1200px
  xxl?: number; // >= 1600px
}

export const getResponsiveColumns = (config: ResponsiveConfig) => {
  return {
    xs: config.xs || 24,
    sm: config.sm || config.xs || 24,
    md: config.md || config.sm || config.xs || 12,
    lg: config.lg || config.md || config.sm || config.xs || 8,
    xl: config.xl || config.lg || config.md || config.sm || config.xs || 6,
    xxl: config.xxl || config.xl || config.lg || config.md || config.sm || config.xs || 6,
  };
};

export const getResponsiveGutter = (): [number, number] => {
  const isMobile = window.innerWidth < 768;
  return isMobile ? [8, 8] : [16, 16];
};

export const isMobileDevice = (): boolean => {
  return window.innerWidth < 768;
};

export const isTabletDevice = (): boolean => {
  return window.innerWidth >= 768 && window.innerWidth < 992;
};

export const isDesktopDevice = (): boolean => {
  return window.innerWidth >= 992;
};

// Breakpoint constants
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

// Common responsive configurations
export const RESPONSIVE_CONFIGS = {
  // For metric cards (4 on desktop, 2 on tablet, 1 on mobile)
  metrics: getResponsiveColumns({ xs: 24, sm: 12, md: 12, lg: 6, xl: 6 }),
  
  // For feature cards (3 on desktop, 2 on tablet, 1 on mobile)
  features: getResponsiveColumns({ xs: 24, sm: 12, md: 8, lg: 8, xl: 8 }),
  
  // For main content areas (2 columns on desktop, 1 on mobile)
  content: getResponsiveColumns({ xs: 24, sm: 24, md: 12, lg: 12, xl: 12 }),
  
  // For sidebar content (1/3 - 2/3 split on desktop, full width on mobile)
  sidebar: getResponsiveColumns({ xs: 24, sm: 24, md: 8, lg: 8, xl: 8 }),
  main: getResponsiveColumns({ xs: 24, sm: 24, md: 16, lg: 16, xl: 16 }),
} as const;

// Hook for responsive behavior
export const useResponsive = () => {
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...windowSize,
    isMobile: windowSize.width < BREAKPOINTS.md,
    isTablet: windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg,
    isDesktop: windowSize.width >= BREAKPOINTS.lg,
    breakpoint: windowSize.width >= BREAKPOINTS.xxl ? 'xxl' :
                windowSize.width >= BREAKPOINTS.xl ? 'xl' :
                windowSize.width >= BREAKPOINTS.lg ? 'lg' :
                windowSize.width >= BREAKPOINTS.md ? 'md' :
                windowSize.width >= BREAKPOINTS.sm ? 'sm' : 'xs',
  };
};

// Import React for the hook
import React from 'react';