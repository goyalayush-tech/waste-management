import React, { createContext, useContext, useState, useCallback } from 'react';

interface User {
  email: string;
  name?: string;
  role?: string;
  company?: string;
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
    return email ? { email, name } : null;
  });

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const token = `mock_token_${Date.now()}`;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', email);

      setIsAuthenticated(true);
      setUser({ email });
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData: any) => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const token = `mock_token_${Date.now()}`;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', userData.fullName);

      setIsAuthenticated(true);
      setUser({
        email: userData.email,
        name: userData.fullName,
        role: userData.role,
        company: userData.company,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUser(null);
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
