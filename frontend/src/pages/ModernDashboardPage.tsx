import React from 'react';
import Dashboard from '../components/modern/Dashboard';
import Navbar from '../components/modern/Navbar';
import { useNavigate } from 'react-router-dom';

const ModernDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
      // Implement actual logout logic here
      navigate('/');
  };

  return (
    <div className="min-h-screen bg-background-dark text-white overflow-x-hidden font-sans">
        <Navbar onLoginClick={() => {}} isLoggedIn={true} />
        <Dashboard onLogout={handleLogout} />
    </div>
  );
};

export default ModernDashboardPage;
