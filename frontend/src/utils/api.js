import axios from "axios";
const api = axios.create({ timeout: 12000 });
api.interceptors.request.use((config) => {
  try {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    localStorage.removeItem("user");
  }
  return config;
});
export const apiBase = import.meta.env.VITE_API_URL || "/api";
export default api;
