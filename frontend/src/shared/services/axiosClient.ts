import axios from 'axios';
import { ACTIVE_VIVERO_STORAGE_KEY } from '../constants/vivero';
import { MOBILE_AUTH_TOKEN_STORAGE_KEY } from '../constants/auth';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true, // Para Sanctum CSRF cookies
  withXSRFToken: true, // axios solo adjunta la cookie XSRF-TOKEN como header en requests same-origin por defecto; el backend vive en otro puerto/origen, así que hay que pedirlo explícitamente.
  // Sin esto, un backend inalcanzable (IP LAN vieja, firewall, servidor caído)
  // deja la petición colgada indefinidamente — en la app móvil eso se ve como
  // pantalla en blanco permanente, porque AuthGate no renderiza nada mientras
  // isLoading sigue en true.
  timeout: 15000,
});

// Interceptor de peticiones
axiosClient.interceptors.request.use(
  (config) => {
    // App móvil (Capacitor): la sesión por cookie de Sanctum no es viable
    // cross-origin (SameSite=Lax nunca se reenvía sola en AJAX cross-site) —
    // ver AuthController::login(). El login para ese cliente entrega un token
    // Bearer en vez de cookie; la web sigue funcionando por cookie, sin token.
    const mobileToken = localStorage.getItem(MOBILE_AUTH_TOKEN_STORAGE_KEY);
    if (mobileToken) {
      config.headers.Authorization = `Bearer ${mobileToken}`;
    }

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
