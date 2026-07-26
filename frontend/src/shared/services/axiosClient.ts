import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true, // Para Sanctum CSRF cookies
});

// Interceptor de peticiones
axiosClient.interceptors.request.use(
  (config) => {
    // Si usas tokens (JWT o Sanctum Bearer) puedes inyectarlo aquí.
    // Ej: const token = localStorage.getItem('token'); if(token) config.headers.Authorization = `Bearer ${token}`;
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
      // Opcional: Redirigir al login o disparar un evento global
      console.warn('No autorizado, redirigiendo a login...');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
