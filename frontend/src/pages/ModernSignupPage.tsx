import React from 'react';
import SignupPage from '../components/modern/SignupPage';
import { useNavigate } from 'react-router-dom';

const ModernSignupPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background-dark text-white overflow-x-hidden font-sans">
            <SignupPage 
                onSuccess={() => navigate('/app/dashboard')}
                onLoginClick={() => navigate('/auth/login')}
                onBack={() => navigate('/')}
            />
        </div>
    );
};
export default ModernSignupPage;
