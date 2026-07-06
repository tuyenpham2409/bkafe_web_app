import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, getToken } from '../lib/api';

export interface UserData {
  id: string;
  username: string;
  usernameChanged: boolean;
  displayName: string;
  email: string;
  role: 'admin' | 'user';
  photoURL: string;
  bio: string;
  joinedAt?: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<UserData>;
  register: (data: { username: string; displayName: string; email: string; password: string }) => Promise<UserData>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (u: UserData | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      if (getToken()) {
        try {
          const { user } = await api.get('/auth/me');
          setUser(user);
        } catch {
          setToken(null);
        }
      }
      setLoading(false);
    };
    boot();
  }, []);

  const login = async (identifier: string, password: string) => {
    const { token, user } = await api.post('/auth/login', { identifier, password });
    setToken(token);
    setUser(user);
    return user;
  };

  const register = async (data: { username: string; displayName: string; email: string; password: string }) => {
    const { token, user } = await api.post('/auth/register', data);
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { user } = await api.get('/auth/me');
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
