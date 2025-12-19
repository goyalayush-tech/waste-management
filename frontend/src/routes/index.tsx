import React, { useMemo } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import AppLayout from '../components/Layout/AppLayout';
import SearchResults from '../pages/Search/SearchResults';
import AdvancedSearch from '../pages/Search/AdvancedSearch';
import NotFound from '../pages/NotFound/NotFound';
import ClaimCleanLandingPage from '../pages/Landing/ClaimCleanLandingPage';
import LoginPage from '../pages/Auth/LoginPage';
import SignupPage from '../pages/Auth/SignupPage';
import claimCleanRoutes from '../features/claimclean/routes';

// Create router configuration function
const createRouterConfig = () => [
    // Landing page as root - show ClaimClean landing
    {
        path: '/',
        element: <ClaimCleanLandingPage />,
        errorElement: <NotFound />,
    },
    // Separate landing route for direct access
    {
        path: '/landing',
        element: <ClaimCleanLandingPage />,
        errorElement: <NotFound />,
    },
    // Authentication routes
    {
        path: '/auth/login',
        element: <LoginPage />,
        errorElement: <NotFound />,
    },
    {
        path: '/auth/signup',
        element: <SignupPage />,
        errorElement: <NotFound />,
    },
    {
        path: '/app',
        element: <AppLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/app/claimclean/dashboard" replace />,
            },
            // Legacy routes redirected to ClaimClean
            {
                path: 'dashboard',
                element: <Navigate to="/app/claimclean/dashboard" replace />,
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