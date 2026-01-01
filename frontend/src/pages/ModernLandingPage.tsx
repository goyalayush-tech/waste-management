import React from 'react';
import Navbar from '../components/modern/Navbar';
import Hero from '../components/modern/Hero';
import ValueProp from '../components/modern/ValueProp';
import ForensicAudit from '../components/modern/ForensicAudit';
import PlatformArchitecture from '../components/modern/PlatformArchitecture';
import OperationsCenter from '../components/modern/OperationsCenter';
import CommandCenter from '../components/modern/CommandCenter';
import DefenseDepth from '../components/modern/DefenseDepth';
import CallToAction from '../components/modern/CallToAction';
import Footer from '../components/modern/Footer';
import { useNavigate } from 'react-router-dom';

const ModernLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-background-dark text-white overflow-x-hidden font-sans">
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
    </div>
  );
};

export default ModernLandingPage;
