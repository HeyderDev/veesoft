// import axios client
import axiosClient from '../../../shared/services/axiosClient';


export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  cedula: string;
  career: string;
  semester: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  first_name: string;
  last_name: string;
  cedula: string;
  career: string;
  semester: number;
  status: 'active' | 'inactive';
}

export const studentService = {
  getStudents: async (params?: { q?: string; status?: string; semester?: number; page?: number }) => {
    const res = await axiosClient.get('/students', { params });
    return res;
  },
  
  createStudent: async (data: StudentFormData) => {
    const payload = { ...data };
    const res = await axiosClient.post('/students', payload);
    return res.data;
  },
  
  updateStudent: async (id: number, data: StudentFormData) => {
    const payload = { ...data };
    const res = await axiosClient.put(`/students/${id}`, payload);
    return res.data;
  },
  
  updateStatus: async (id: number, status: 'active' | 'inactive') => {
    const res = await axiosClient.patch(`/students/${id}/status`, { status });
    return res.data;
  },

  importCsv: async (students: any[]) => {
    const res = await axiosClient.post('/students/import', { students });
    return res.data;
  }
};
