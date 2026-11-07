import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [driver, setDriver] = useState(() => {
    try { return JSON.parse(localStorage.getItem('driver_profile') || 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('driver_token')));

  useEffect(() => {
    const handleUnauthorized = () => {
      setDriver(null);
      setLoading(false);
    };
    window.addEventListener('driver:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('driver:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('driver_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => {
        setDriver(data.driver);
        localStorage.setItem('driver_profile', JSON.stringify(data.driver));
      })
      .catch(() => {
        localStorage.removeItem('driver_token');
        localStorage.removeItem('driver_profile');
        setDriver(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('driver_token', data.token);
    localStorage.setItem('driver_profile', JSON.stringify(data.driver));
    setDriver(data.driver);
    return data.driver;
  };

  const logout = () => {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_profile');
    setDriver(null);
  };

  const updateDriver = (nextDriver) => {
    setDriver(nextDriver);
    localStorage.setItem('driver_profile', JSON.stringify(nextDriver));
  };

  const value = useMemo(() => ({ driver, loading, login, logout, updateDriver }), [driver, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
