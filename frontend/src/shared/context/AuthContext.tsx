/* eslint-disable react-refresh/only-export-components */
import axios from 'axios';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import axiosClient from '../services/axiosClient';

export interface AuthRole {
  id: number;
  name: string;
  permissions: string[];
}

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  role: AuthRole | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const csrfCookieUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  if (!apiUrl) {
    return '/sanctum/csrf-cookie';
  }

  return `${apiUrl.replace(/\/api\/v1\/?$/, '')}/sanctum/csrf-cookie`;
};

const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<ApiResponse<null>>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void axiosClient
      .get('/me')
      .then((response) => {
        const session = response as unknown as ApiResponse<AuthUser>;
        setUser(session.data);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      await axios.get(csrfCookieUrl(), {
        headers: { Accept: 'application/json' },
        withCredentials: true,
      });

      const response = await axiosClient.post('/login', credentials) as unknown as ApiResponse<AuthUser>;
      setUser(response.data);
    } catch (error) {
      setUser(null);
      throw new Error(apiErrorMessage(error, 'No fue posible iniciar sesión.'));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    isAuthenticated: user !== null,
    isLoading,
    user,
    login,
    logout,
  }), [isLoading, login, logout, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
