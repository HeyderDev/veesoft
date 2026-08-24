import axios from 'axios';
import { ACTIVE_VIVERO_STORAGE_KEY } from '../constants/vivero';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true, // Para Sanctum CSRF cookies
  withXSRFToken: true, // axios solo adjunta la cookie XSRF-TOKEN como header en requests same-origin por defecto; el backend vive en otro puerto/origen, así que hay que pedirlo explícitamente.
});

// Interceptor de peticiones
axiosClient.interceptors.request.use(
  (config) => {
    // Si usas tokens (JWT o Sanctum Bearer) puedes inyectarlo aquí.
    // Ej: const token = localStorage.getItem('token'); if(token) config.headers.Authorization = `Bearer ${token}`;
    const viveroId = localStorage.getItem(ACTIVE_VIVERO_STORAGE_KEY);
    if (viveroId) {
      config.headers['X-Vivero-Id'] = viveroId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas
axiosClient.interceptors.response.use(
  (response) => response.data, // Automáticamente retornar los datos
  (error) => {
    // Manejo global de errores (ej. 401 Unauthorized)
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
