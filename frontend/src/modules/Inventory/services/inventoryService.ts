import axiosClient from '../../../shared/services/axiosClient';
import type { Tool, Supply, Movement } from '../types';

export const inventoryService = {
  // Tools
  getTools: (q?: string) => 
    axiosClient.get<{ data: Tool[] }>('/tools', { params: { q } }).then(res => (res as any).data),
    
  getToolUnitByCode: (code: string) => 
    axiosClient.get(`/tool-units/code/${code}`).then(res => (res as any).data),
  
  createTool: (data: Partial<Tool>) => 
    axiosClient.post('/tools', data).then(res => (res as any).data),
    
  updateTool: (id: number, data: Partial<Tool>) => 
    axiosClient.put(`/tools/${id}`, data).then(res => (res as any).data),
    
  createToolUnit: (toolId: number) =>
    axiosClient.post(`/tools/${toolId}/units`).then(res => (res as any).data),
    
  updateToolUnitStatus: (id: number, status: string, details?: any) => 
    axiosClient.patch(`/tool-units/${id}/status`, { status, details }).then(res => (res as any).data),
    
  deleteToolUnit: (id: number, motivo: string) =>
    axiosClient.delete(`/tool-units/${id}`, { data: { motivo } }).then(res => (res as any).data),
    
  deleteTool: (id: number) => 
    axiosClient.delete(`/tools/${id}`).then(res => res.data),

  printLabel: (name: string, code: string, format: 'qr' | 'barcode') =>
    axiosClient.post('/tools/print-label', { name, code, format }).then(res => res.data),

  // Supplies
  getSupplies: (q?: string) => 
    axiosClient.get<{ data: Supply[] }>('/supplies', { params: { q } }).then(res => (res as any).data),
    
  createSupply: (data: Partial<Supply>) => 
    axiosClient.post('/supplies', data).then(res => (res as any).data),
    
  updateSupply: (id: number, data: Partial<Supply>) => 
    axiosClient.put(`/supplies/${id}`, data).then(res => (res as any).data),
    
  deleteSupply: (id: number) => 
    axiosClient.delete(`/supplies/${id}`).then(res => res.data),
    
  getSupplyByCode: (code: string) =>
    axiosClient.get(`/supplies/code/${code}`).then(res => (res as any).data),
    
  registerSupplyMovement: (supplyId: number, type: string, quantity: number, reason?: string, observation?: string, scannedCode?: string, studentId?: number) =>
    axiosClient.post(`/supplies/${supplyId}/movements`, { type, quantity, reason, observation, scanned_code: scannedCode, student_id: studentId }).then(res => (res as any).data),

  // Movements
  getMovements: (page: number = 1, type?: string, q?: string, startDate?: string, endDate?: string) => 
    axiosClient.get<{ data: Movement[], meta: any }>('/movements', { params: { page, per_page: 20, type, q, startDate, endDate } }).then(res => res as any),

  // Students
  getStudents: (q?: string) => 
    axiosClient.get('/students', { params: { search: q } }).then(res => res as any),
    
  getStudentByCedula: (cedula: string) =>
    axiosClient.get(`/students/search/${cedula}`).then(res => res as any),

  importStudents: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res as any);
  },

  createStudent: (data: any) =>
    axiosClient.post('/students', data).then(res => res as any),

  updateStudent: (id: number, data: any) =>
    axiosClient.put(`/students/${id}`, data).then(res => res as any),

  deleteStudent: (id: number) =>
    axiosClient.delete(`/students/${id}`).then(res => res as any),

  // Shared / Tasks
  getTasks: (q?: string) =>
    axiosClient.get('/tasks', { params: { q } }).then(res => (res as any).data),
};
