import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { getToken, setToken } from '../api/storage';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          const { user } = await api.get('/auth/me');
          setUser(user);
        } catch {
          await setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (identifier, password) => {
    const { token, user } = await api.post('/auth/login', { identifier, password });
    await setToken(token);
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const { token, user } = await api.post('/auth/register', data);
    await setToken(token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { user } = await api.get('/auth/me');
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
