import axiosClient from '../../../shared/services/axiosClient';
import type { Tool, Supply, Movement } from '../types';

export const inventoryService = {
  // Tools
  getTools: (q?: string) => 
    axiosClient.get<{ data: Tool[] }>('/tools', { params: { q } }).then(res => (res as any).data),
  
  createTool: (data: Partial<Tool>) => 
    axiosClient.post('/tools', data).then(res => (res as any).data),
    
  updateTool: (id: number, data: Partial<Tool>) => 
    axiosClient.put(`/tools/${id}`, data).then(res => (res as any).data),
    
  updateToolStatus: (id: number, status: string, details?: any) => 
    axiosClient.patch(`/tools/${id}/status`, { status, details }).then(res => (res as any).data),
    
  deleteTool: (id: number) => 
    axiosClient.delete(`/tools/${id}`).then(res => res.data),

  // Supplies
  getSupplies: (q?: string) => 
    axiosClient.get<{ data: Supply[] }>('/supplies', { params: { q } }).then(res => (res as any).data),
    
  createSupply: (data: Partial<Supply>) => 
    axiosClient.post('/supplies', data).then(res => (res as any).data),
    
  updateSupply: (id: number, data: Partial<Supply>) => 
    axiosClient.put(`/supplies/${id}`, data).then(res => (res as any).data),
    
  deleteSupply: (id: number) => 
    axiosClient.delete(`/supplies/${id}`).then(res => res.data),

  // Movements
  getMovements: (type?: string, q?: string, startDate?: string, endDate?: string) => 
    axiosClient.get<{ data: Movement[] }>('/movements', { params: { type, q, startDate, endDate } }).then(res => (res as any).data),
};
