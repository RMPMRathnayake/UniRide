import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', timeout: 20000 });
api.interceptors.request.use((config) => {
  const role = localStorage.getItem('waygo_active_role');
  const token = role === 'rider' || role === 'driver' ? localStorage.getItem(`waygo_${role}_token`) : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !String(error.config?.url || '').includes('/auth/login') && !String(error.config?.url || '').includes('/auth/register')) {
    const role = localStorage.getItem('waygo_active_role');
    if (role === 'rider' || role === 'driver') {
      localStorage.removeItem(`waygo_${role}_token`);
      localStorage.removeItem(`waygo_${role}_profile`);
    }
    localStorage.removeItem('waygo_active_role');
    window.dispatchEvent(new Event('waygo:unauthorized'));
  }
  return Promise.reject(error);
});
export const getErrorMessage = (error) => error.response?.data?.message || error.message || 'Something went wrong.';
export default api;
