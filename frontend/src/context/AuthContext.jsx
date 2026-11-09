import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const readProfile = (role) => {
  try { return JSON.parse(localStorage.getItem(`waygo_${role}_profile`) || 'null'); }
  catch { return null; }
};
const tokenKey = (role) => `waygo_${role}_token`;

export function AuthProvider({ children }) {
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem('waygo_active_role') || '');
  const [rider, setRider] = useState(() => localStorage.getItem('waygo_active_role') === 'rider' ? readProfile('rider') : null);
  const [driver, setDriver] = useState(() => localStorage.getItem('waygo_active_role') === 'driver' ? readProfile('driver') : null);
  const [loading, setLoading] = useState(() => {
    const role = localStorage.getItem('waygo_active_role');
    return Boolean(role && localStorage.getItem(tokenKey(role)));
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      const role = localStorage.getItem('waygo_active_role');
      if (role === 'rider') { setRider(null); localStorage.removeItem('waygo_rider_profile'); }
      if (role === 'driver') { setDriver(null); localStorage.removeItem('waygo_driver_profile'); }
      setLoading(false);
    };
    window.addEventListener('waygo:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('waygo:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('waygo_active_role');
    const token = role && localStorage.getItem(tokenKey(role));
    if (!token || !['rider', 'driver'].includes(role)) { setLoading(false); return; }
    api.get('/auth/me').then(({ data }) => {
      if (role === 'rider') {
        setRider(data.rider);
        localStorage.setItem('waygo_rider_profile', JSON.stringify(data.rider));
      } else {
        setDriver(data.driver);
        localStorage.setItem('waygo_driver_profile', JSON.stringify(data.driver));
      }
    }).catch(() => {
      localStorage.removeItem(tokenKey(role));
      localStorage.removeItem(`waygo_${role}_profile`);
      localStorage.removeItem('waygo_active_role');
      setRider(null); setDriver(null); setActiveRole('');
    }).finally(() => setLoading(false));
  }, []);

  const loginRider = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password, role: 'rider' });
    localStorage.setItem('waygo_active_role', 'rider');
    localStorage.setItem(tokenKey('rider'), data.token);
    localStorage.setItem('waygo_rider_profile', JSON.stringify(data.rider));
    setActiveRole('rider'); setDriver(null); setRider(data.rider); setLoading(false);
    return data.rider;
  };

  const loginDriver = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password, role: 'driver' });
    localStorage.setItem('waygo_active_role', 'driver');
    localStorage.setItem(tokenKey('driver'), data.token);
    localStorage.setItem('waygo_driver_profile', JSON.stringify(data.driver));
    setActiveRole('driver'); setRider(null); setDriver(data.driver); setLoading(false);
    return data.driver;
  };

  const registerRider = async (details) => {
    const { data } = await api.post('/auth/register', details);
    localStorage.setItem('waygo_active_role', 'rider');
    localStorage.setItem(tokenKey('rider'), data.token);
    localStorage.setItem('waygo_rider_profile', JSON.stringify(data.rider));
    setActiveRole('rider'); setDriver(null); setRider(data.rider); setLoading(false);
    return data.rider;
  };

  const logout = () => {
    const role = localStorage.getItem('waygo_active_role') || activeRole;
    if (role) {
      localStorage.removeItem(tokenKey(role));
      localStorage.removeItem(`waygo_${role}_profile`);
    }
    localStorage.removeItem('waygo_active_role');
    setActiveRole(''); setRider(null); setDriver(null);
  };

  const updateRider = (next) => { setRider(next); localStorage.setItem('waygo_rider_profile', JSON.stringify(next)); };
  const updateDriver = (next) => { setDriver(next); localStorage.setItem('waygo_driver_profile', JSON.stringify(next)); };
  const value = useMemo(() => ({ activeRole, rider, driver, loading, loginRider, loginDriver, registerRider, logout, updateRider, updateDriver }), [activeRole, rider, driver, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
