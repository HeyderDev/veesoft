import axiosClient from '../../../shared/services/axiosClient';
import type {
  PendingDeliveryItem, PurchaseOrder, PurchaseOrderItemInput, PurchaseRequest,
  PurchaseRequestItemInput, QualityStatus, Supplier, SupplierEvaluationInput, SupplierCatalogItem,
  CertificateAlert, UnregisteredItem, PurchaseSpendReport,
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
  getSupplierCatalog: (id: number) => axiosClient.get<SupplierCatalogItem[]>(`/suppliers/${id}/catalog`),
  updateSupplierCatalog: (id: number, items: { item_type: 'supply' | 'tool'; item_id: number; unit_price: number }[]) =>
    axiosClient.put<SupplierCatalogItem[]>(`/suppliers/${id}/catalog`, { items }),
  getCertificateAlerts: () => axiosClient.get<CertificateAlert[]>('/suppliers-certificates/alerts'),
  getInventorySupplies: () => axiosClient.get<SupplierCatalogItem[]>('/supplies'),
  getInventoryTools: () => axiosClient.get<SupplierCatalogItem[]>('/tools'),

  // ---- Órdenes de compra ----
  getPurchaseOrders: () => axiosClient.get<PurchaseOrder[]>('/purchase-orders'),
  createPurchaseOrder: (data: {
    supplier_id: number; estimated_delivery_date?: string; items: PurchaseOrderItemInput[];
  }) => axiosClient.post<PurchaseOrder>('/purchase-orders', data),
  getPurchaseOrder: (id: number) => axiosClient.get<PurchaseOrder>(`/purchase-orders/${id}`),
  receivePurchaseOrder: (id: number, data: {
    quality_status: QualityStatus; observations?: string; photo_evidence_url?: string;
  }) => axiosClient.post(`/purchase-orders/${id}/receive`, data),
  getPendingDeliveries: () => axiosClient.get<PendingDeliveryItem[]>('/purchase-orders/pending-deliveries'),
  getUnregisteredItems: () => axiosClient.get<UnregisteredItem[]>('/purchase-orders/unregistered-items'),

  // ---- Solicitudes de aprovisionamiento ----
  getPurchaseRequests: () => axiosClient.get<PurchaseRequest[]>('/purchase-requests'),
  createPurchaseRequest: (data: { reason: string; items: PurchaseRequestItemInput[] }) =>
    axiosClient.post<PurchaseRequest>('/purchase-requests', data),
  getPurchaseRequest: (id: number) => axiosClient.get<PurchaseRequest>(`/purchase-requests/${id}`),
  reviewPurchaseRequest: (id: number, data: {
    decision: 'approved' | 'rejected'; supplier_id?: number; estimated_delivery_date?: string;
  }) => axiosClient.post(`/purchase-requests/${id}/review`, data),

  // ---- Reporte de gasto en compras para el rango de fechas de una Meta de Producción ----
  getPurchaseSpendReport: (params: { start_date: string; end_date: string; label: string }) =>
    axiosClient.get<PurchaseSpendReport>('/purchase-orders/spend-report', { params }),
};
