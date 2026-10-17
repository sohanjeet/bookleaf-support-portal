import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  logout: () => void;
  switchUser: (email: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const existingToken = api.getToken();
      if (!existingToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.data);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        api.setToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password = 'password123'): Promise<User> => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const switchUser = async (email: string): Promise<User> => {
    return login(email, 'password123');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
