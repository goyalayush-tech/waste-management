import type { RouteObject } from 'react-router-dom';
import ClaimCleanDashboard from './views/ClaimCleanDashboard';
import ClaimList from './views/ClaimList';
import ClaimNew from './views/ClaimNew';
import ClaimDetail from './views/ClaimDetail';
import AuditorConsole from './views/AuditorConsole';
import FieldAudits from './views/FieldAudits';
import Reports from './views/Reports';
import AdminDashboard from './views/AdminDashboard';

const claimCleanRoutes: RouteObject = {
  path: 'claimclean',
  children: [
    // Phase 1: ClaimClean Core Routes
    { index: true, element: <ClaimCleanDashboard /> },
    { path: 'dashboard', element: <ClaimCleanDashboard /> },
    
    // Claims Management
    { path: 'claims', element: <ClaimList /> },
    { path: 'claims/new', element: <ClaimNew /> },
    { path: 'claims/:claimId', element: <ClaimDetail /> },
    
    // Audits
    { path: 'audits/console', element: <AuditorConsole /> },
    { path: 'audits/field', element: <FieldAudits /> },
    
    // Reports
    { path: 'reports', element: <Reports /> },
    
    // Admin (ClaimClean specific admin features)
    { path: 'admin', element: <AdminDashboard /> },
    
    // Legacy routes (keep for backward compatibility)
    { path: 'new', element: <ClaimNew /> }, // Redirect old "new" to "claims/new"
    { path: ':claimId', element: <ClaimDetail /> }, // Redirect old claim detail format
    { path: 'auditor', element: <AuditorConsole /> }, // Redirect old auditor to console
  ],
};

export default claimCleanRoutes;
