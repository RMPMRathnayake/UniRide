import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("uniride_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("uniride_admin_token");
      localStorage.removeItem("uniride_admin_user");
      if (window.location.pathname !== "/admin/login") window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export default api;
