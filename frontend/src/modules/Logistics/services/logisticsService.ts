import axiosClient from '../../../shared/services/axiosClient';
import type {
  PendingDeliveryItem, PurchaseOrder, PurchaseOrderItemInput, PurchaseRequest,
  PurchaseRequestItemInput, QualityStatus, Supplier, SupplierEvaluationInput,
} from '../types';

/**
 * Único punto de acceso a la API para el módulo Logistics.
 * Ningún componente ni viewmodel debe llamar a axiosClient directamente.
 */
export const logisticsService = {
  // ---- Proveedores ----
  getSuppliers: () => axiosClient.get<Supplier[]>('/suppliers'),
  createSupplier: (data: Partial<Supplier>) => axiosClient.post('/suppliers', data),
  updateSupplier: (id: number, data: Partial<Supplier>) => axiosClient.put(`/suppliers/${id}`, data),
  deleteSupplier: (id: number) => axiosClient.delete(`/suppliers/${id}`),
  evaluateSupplier: (id: number, data: SupplierEvaluationInput) =>
    axiosClient.post(`/suppliers/${id}/evaluate`, data),
  getSupplierPurchaseHistory: (id: number) => axiosClient.get<PurchaseOrder[]>(`/suppliers/${id}/purchase-orders`),

  // ---- Órdenes de compra ----
  getPurchaseOrders: () => axiosClient.get<PurchaseOrder[]>('/purchase-orders'),
  createPurchaseOrder: (data: {
    order_number: string; supplier_id: number; estimated_delivery_date?: string; items: PurchaseOrderItemInput[];
  }) => axiosClient.post<PurchaseOrder>('/purchase-orders', data),
  getPurchaseOrder: (id: number) => axiosClient.get<PurchaseOrder>(`/purchase-orders/${id}`),
  receivePurchaseOrder: (id: number, data: {
    quality_status: QualityStatus; substrate_temperature?: number; observations?: string; photo_evidence_url?: string;
  }) => axiosClient.post(`/purchase-orders/${id}/receive`, data),
  getPendingDeliveries: () => axiosClient.get<PendingDeliveryItem[]>('/purchase-orders/pending-deliveries'),
  getNextOrderNumber: () => axiosClient.get<{ order_number: string }>('/purchase-orders/next-number'),

  // ---- Solicitudes de aprovisionamiento ----
  getPurchaseRequests: () => axiosClient.get<PurchaseRequest[]>('/purchase-requests'),
  createPurchaseRequest: (data: { reason: string; items: PurchaseRequestItemInput[] }) =>
    axiosClient.post<PurchaseRequest>('/purchase-requests', data),
  getPurchaseRequest: (id: number) => axiosClient.get<PurchaseRequest>(`/purchase-requests/${id}`),
  reviewPurchaseRequest: (id: number, data: {
    decision: 'approved' | 'rejected'; order_number?: string; supplier_id?: number; estimated_delivery_date?: string;
    unit_prices?: Record<number, number>;
  }) => axiosClient.post(`/purchase-requests/${id}/review`, data),
};
