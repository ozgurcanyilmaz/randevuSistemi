import axios from "axios";
import { logout } from "./auth";

export const API_BASE_URL = "http://localhost:5180";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; 
      if (Date.now() >= exp) {
        logout();
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
        return Promise.reject(new Error("Token expired"));
      }
    } catch {
      logout();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
      return Promise.reject(new Error("Invalid token"));
    }
    
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      const isLoginPage =
        currentPath === "/login" || currentPath === "/register";
      const hasToken = !!localStorage.getItem("token");

      if (!isLoginPage && hasToken) {
        logout();
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }
    return Promise.reject(error);
  }
);
