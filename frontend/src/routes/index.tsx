import React, { useMemo } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
// import AppLayout from '../components/Layout/AppLayout';
import SearchResults from '../pages/Search/SearchResults';
import AdvancedSearch from '../pages/Search/AdvancedSearch';
import NotFound from '../pages/NotFound/NotFound';
import ModernLandingPage from '../pages/ModernLandingPage';
import ModernLoginPage from '../pages/ModernLoginPage';
import ModernSignupPage from '../pages/ModernSignupPage';
import ModernDashboardPage from '../pages/ModernDashboardPage';
import claimCleanRoutes from '../features/claimclean/routes';
import ProtectedRoute from '../components/Auth/ProtectedRoute';

// Create router configuration function
const createRouterConfig = () => [
    // Landing page as root - show Modern landing
    {
        path: '/',
        element: <ModernLandingPage />,
        errorElement: <NotFound />,
    },
    // Separate landing route for direct access
    {
        path: '/landing',
        element: <ModernLandingPage />,
        errorElement: <NotFound />,
    },
    // Authentication routes
    {
        path: '/auth/login',
        element: <ModernLoginPage />,
        errorElement: <NotFound />,
    },
    {
        path: '/auth/signup',
        element: <ModernSignupPage />,
        errorElement: <NotFound />,
    },
    {
        path: '/app',
        element: <ProtectedRoute><Outlet /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <Navigate to="/app/dashboard" replace />,
            },
            {
                path: 'dashboard',
                element: <ModernDashboardPage />,
            },
            // Legacy routes redirected to ClaimClean
            {
                path: 'claimclean/dashboard',
                element: <Navigate to="/app/dashboard" replace />,
            },
            // ClaimClean routes
            claimCleanRoutes,
            {
                path: 'search',
                element: <SearchResults />,
            },
            {
                path: 'search/advanced',
                element: <AdvancedSearch />,
            },
        ],
        errorElement: <NotFound />,
    },
];

// Router Provider Component with memoized router
const AppRouter: React.FC = () => {
    const router = useMemo(() => createBrowserRouter(createRouterConfig()), []);

    try {
        return <RouterProvider router={router} />;
    } catch (error) {
        console.error('Router Error:', error);
        return (
            <div className="router-error">
                <h1>Router Error</h1>
                <p>There was an error with the routing system.</p>
                <pre>{String(error)}</pre>
            </div>
        );
    }
};

export default AppRouter;