import axios from 'axios';
import { getToken, clearSession } from './auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://rewive-backend.jollymushroom-0ce515bf.eastus.azurecontainerapps.io';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
