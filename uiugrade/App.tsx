import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ValueProp from './components/ValueProp';
import ForensicAudit from './components/ForensicAudit';
import PlatformArchitecture from './components/PlatformArchitecture';
import OperationsCenter from './components/OperationsCenter';
import CommandCenter from './components/CommandCenter';
import DefenseDepth from './components/DefenseDepth';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import NotFound from './components/NotFound';

type PageState = 'home' | 'login' | 'signup' | 'dashboard' | '404';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageState>('home');

  // Simple URL hash routing simulation for 404 testing
  useEffect(() => {
    const checkHash = () => {
       if (window.location.hash === '#404') {
           setCurrentPage('404');
       }
    };
    window.addEventListener('hashchange', checkHash);
    checkHash();
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleLoginClick = () => {
    if (currentPage === 'dashboard') {
      setCurrentPage('home');
    } else {
      setCurrentPage('login');
    }
  };

  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-background-dark text-white overflow-x-hidden font-sans">
      {currentPage === 'home' && (
        <>
          <Navbar onLoginClick={handleLoginClick} isLoggedIn={false} />
          <main>
            <Hero />
            <ValueProp />
            <ForensicAudit />
            <PlatformArchitecture />
            <OperationsCenter />
            <CommandCenter />
            <DefenseDepth />
            <CallToAction />
          </main>
          <Footer />
        </>
      )}

      {currentPage === 'login' && (
        <LoginPage 
          onSuccess={handleLoginSuccess} 
          onSignupClick={() => setCurrentPage('signup')}
          onBack={() => setCurrentPage('home')} 
        />
      )}

      {currentPage === 'signup' && (
        <SignupPage 
          onSuccess={handleLoginSuccess}
          onLoginClick={() => setCurrentPage('login')}
          onBack={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'dashboard' && (
        <>
          <Navbar onLoginClick={handleLoginClick} isLoggedIn={true} />
          <Dashboard onLogout={() => setCurrentPage('home')} />
        </>
      )}

      {currentPage === '404' && (
          <NotFound onBack={() => setCurrentPage('home')} />
      )}
    </div>
  );
};

export default App;