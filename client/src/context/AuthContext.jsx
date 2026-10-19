import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api.get('/auth/session').then((d) => setUser(d.user)).catch(() => setUser(null));
  }, []);

  const login = useCallback(async (body) => {
    const d = await api.post('/auth/login', body);
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (body) => {
    const d = await api.post('/auth/register', body);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading: user === undefined, login, register, logout, setUser }), [user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
