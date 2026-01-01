import React from 'react';
import LoginPage from '../components/modern/LoginPage';
import { useNavigate } from 'react-router-dom';

const ModernLoginPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background-dark text-white overflow-x-hidden font-sans">
            <LoginPage 
                onSuccess={() => navigate('/app/dashboard')} 
                onSignupClick={() => navigate('/auth/signup')}
                onBack={() => navigate('/')}
            />
        </div>
    );
};
export default ModernLoginPage;
