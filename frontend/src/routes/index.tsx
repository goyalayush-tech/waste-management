import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import AppLayout from '../components/Layout/AppLayout';
import LandingPage from '../pages/Landing/LandingPage';
import Dashboard from '../pages/Dashboard/Dashboard';
import WasteAnalysis from '../pages/WasteAnalysis/WasteAnalysis';
import ContaminationDetection from '../pages/ContaminationDetection/ContaminationDetection';
import BlockchainCertificates from '../pages/Blockchain/BlockchainCertificates';
import DigitalTwins from '../pages/DigitalTwins/DigitalTwins';
import Analytics from '../pages/Analytics/Analytics';
import Settings from '../pages/Settings/Settings';
import SearchResults from '../pages/Search/SearchResults';
import AdvancedSearch from '../pages/Search/AdvancedSearch';
import NotFound from '../pages/NotFound/NotFound';
import DocumentUpload from '../pages/EPR/DocumentUpload';
import EprLanding from '../pages/EPR/EprLanding';
import DocumentsList from '../pages/EPR/DocumentsList';
import DocumentDetail from '../pages/EPR/DocumentDetail';
import CompliancePage from '../pages/EPR/CompliancePage';
import RecyclersPage from '../pages/EPR/RecyclersPage';
import ClientsPage from '../pages/EPR/ClientsPage';
import BillingPage from '../pages/EPR/BillingPage';

// Route configuration
export const router = createBrowserRouter([
    // Public landing route
    {
        path: '/landing',
        element: <LandingPage />,
        errorElement: <NotFound />,
    },
    {
        path: '/',
        element: <AppLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/landing" replace />,
            },
            {
                path: 'dashboard',
                element: <Dashboard />,
            },
            {
                path: 'waste-analysis',
                element: <WasteAnalysis />,
            },
            {
                path: 'contamination-detection',
                element: <ContaminationDetection />,
            },
            {
                path: 'blockchain',
                children: [
                    {
                        index: true,
                        element: <BlockchainCertificates />,
                    },
                    {
                        path: 'certificates',
                        element: <BlockchainCertificates />,
                    },
                    {
                        path: 'digital-twins',
                        element: <DigitalTwins />,
                    },
                ],
            },
            {
                path: 'analytics',
                element: <Analytics />,
            },
            {
                path: 'settings',
                element: <Settings />,
            },
            {
                path: 'epr',
                children: [
                    { index: true, element: <EprLanding /> },
                    { path: 'upload', element: <DocumentUpload /> },
                    { path: 'documents', element: <DocumentsList /> },
                    { path: 'documents/:id', element: <DocumentDetail /> },
                    { path: 'compliance', element: <CompliancePage /> },
                    { path: 'recyclers', element: <RecyclersPage /> },
                    { path: 'clients', element: <ClientsPage /> },
                    { path: 'billing', element: <BillingPage /> },
                ],
            },
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
]);

// Router Provider Component
const AppRouter: React.FC = () => {
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