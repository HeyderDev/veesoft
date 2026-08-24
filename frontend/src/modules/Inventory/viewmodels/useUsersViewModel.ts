import { useState, useEffect } from 'react';
import axios from 'axios';

export interface UserReport {
  id: number;
  first_name: string;
  last_name: string;
  cedula: string;
  role: string; // 'Admin' | 'Operario'
  active_loans: number;
  overdue: boolean;
}

export const useUsersViewModel = () => {
  const [users, setUsers] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return { users, loading, error, loadUsers };
};
