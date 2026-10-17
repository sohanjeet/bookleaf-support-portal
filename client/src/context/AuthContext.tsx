import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, ApiError } from '../services/api';

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
        // Only a rejected credential ends the session. A timeout, network failure or 5xx says nothing
        // about the token, so it is kept for the next attempt; the user simply lands on the login screen.
        const rejected = err instanceof ApiError && (err.status === 401 || err.status === 403);
        console.warn(rejected ? 'Session expired or invalid:' : 'Could not restore session:', err);
        if (rejected) {
          api.setToken(null);
          setToken(null);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password = 'password123'): Promise<User> => {
    // Not toggling the global `loading` flag: it would unmount the login form and wipe its error/email state on failure.
    const data = await api.login(email, password);
    setUser(data.user);
    setToken(data.token);
    return data.user;
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
