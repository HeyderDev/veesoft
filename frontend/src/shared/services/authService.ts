import axios from 'axios';
import axiosClient from './axiosClient';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const ROOT_URL = API_URL.replace(/\/api\/v1\/?$/, '');

export const authService = {
  // Sanctum SPA: primero la cookie CSRF (fuera del prefijo /api/v1), luego el login.
  getCsrfCookie: () => axios.get(`${ROOT_URL}/sanctum/csrf-cookie`, { withCredentials: true }),
  login: (email: string, password: string) => axiosClient.post('/login', { email, password }),
  logout: () => axiosClient.post('/logout'),
  me: () => axiosClient.get('/user'),
};
