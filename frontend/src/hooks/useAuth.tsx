import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ApiClientFactory } from '../services/api/apiClientFactory';
import { User as ApiUser } from '../services/api/authClient';

interface User {
  email: string;
  name?: string;
  role?: string;
  company?: string;
  id?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('authToken');
  });

  const [user, setUser] = useState<User | null>(() => {
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');
    return email ? { email, name: name || undefined, role: role || undefined } : null;
  });

  const [loading, setLoading] = useState(false);
  const authClient = ApiClientFactory.getInstance().getAuthClient();

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authClient.login({ email, password });
      
      const token = response.token;
      const userData = response.user;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', `${userData.firstName} ${userData.lastName}`);
      localStorage.setItem('userRole', userData.role);

      setIsAuthenticated(true);
      setUser({
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        company: userData.companyName,
        id: userData.id
      });
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData: any) => {
    setLoading(true);
    try {
      const response = await authClient.register({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName || userData.fullName?.split(' ')[0] || 'User',
        lastName: userData.lastName || userData.fullName?.split(' ').slice(1).join(' ') || '',
        companyName: userData.company,
        role: userData.role || 'viewer'
      });

      const token = response.token;
      const user = response.user;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userName', `${user.firstName} ${user.lastName}`);
      localStorage.setItem('userRole', user.role);

      setIsAuthenticated(true);
      setUser({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        company: user.companyName,
        id: user.id
      });
    } catch (error) {
      console.error("Signup failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUser(null);
    // Optional: Call backend logout if needed
    // authClient.logout(); 
  }, []);

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('authToken');
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    signup,
    logout,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
