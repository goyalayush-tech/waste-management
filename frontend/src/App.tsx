import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { ConfigProvider, theme, notification } from 'antd';
import { store } from './store/store';
import AppRouter from './routes';
import { ErrorBoundary } from './components/Shared';
import { OnboardingProvider } from './components/Onboarding';
import { AuthProvider } from './hooks/useAuth';
import { registerSW } from './utils/serviceWorker';
import { configureApiClients } from './services/api';
import ApiStatus from './components/Debug/ApiStatus';
import './App.css';

const App: React.FC = () => {
  useEffect(() => {
    // Configure API clients based on environment
    configureApiClients();
    
    // Register service worker for PWA functionality
    registerSW({
      onSuccess: (registration) => {
        console.log('SW registered: ', registration);
        notification.success({
          message: 'App Ready for Offline Use',
          description: 'The app has been cached and is ready to work offline.',
          duration: 3,
        });
      },
      onUpdate: (registration) => {
        console.log('SW updated: ', registration);
        notification.info({
          message: 'App Update Available',
          description: 'A new version is available. Refresh to update.',
          duration: 0,
          btn: (
            <button
              onClick={() => {
                if (registration && registration.waiting) {
                  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                window.location.reload();
              }}
              style={{
                background: '#00b96b',
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Update Now
            </button>
          ),
        });
      },
    });
  }, []);

  try {
    return (
      <Provider store={store}>
        <AuthProvider>
          <ConfigProvider
            theme={{
              algorithm: theme.defaultAlgorithm,
              token: {
                colorPrimary: '#1B5E20', // Forest Green (ClaimClean primary)
                colorSuccess: '#16A34A', // Success green
                colorWarning: '#F59E0B', // Amber for warnings
                colorError: '#EF4444', // Critical red
                colorInfo: '#0284C7', // Info blue
                colorBgBase: '#ffffff',
                colorTextBase: '#000000',
                colorBgContainer: '#ffffff',
                colorBgElevated: '#ffffff',
                colorBorder: '#d9d9d9',
                fontFamily: 'Inter, system-ui, sans-serif',
                borderRadius: 8,
              },
            }}
          >
            <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
              <OnboardingProvider>
                <AppRouter />
                {process.env.NODE_ENV === 'development' && <ApiStatus />}
              </OnboardingProvider>
            </ErrorBoundary>
          </ConfigProvider>
        </AuthProvider>
      </Provider>
    );
  } catch (error) {
    console.error('App Error:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Application Error</h1>
        <p>Something went wrong. Check the console for details.</p>
        <pre>{String(error)}</pre>
      </div>
    );
  }
};

export default App;