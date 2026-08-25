import axiosClient from '../../../shared/services/axiosClient';
import type {
  PendingDeliveryItem, PurchaseOrder, PurchaseOrderItemInput,
  QualityStatus, Supplier, SupplierEvaluationInput, SupplierCatalogItem,
  CertificateAlert, UnregisteredItem, PurchaseSpendReport, SupplierSpendSummary,
} from '../types';

function supplierFormData(data: Partial<Supplier>, method?: 'PUT'): FormData {
  const form = new FormData();
  if (method) form.append('_method', method);
  (['name', 'tax_id', 'email', 'phone', 'address', 'status'] as const).forEach(key => {
    const value = data[key];
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  form.append('organic_certified', data.organic_certified ? '1' : '0');

  const certification = data.certification;
  if (certification) {
    (['certificate_number', 'certifying_entity', 'issued_at', 'expires_at'] as const).forEach(key => {
      const value = certification[key];
      if (value) form.append(`certification[${key}]`, value);
    });
    if (certification.file) form.append('certification[file]', certification.file);
  }
  return form;
}

/**
 * Único punto de acceso a la API para el módulo Logistics.
 * Ningún componente ni viewmodel debe llamar a axiosClient directamente.
 */
export const logisticsService = {
  // ---- Proveedores ----
  getSuppliers: (page = 1) => axiosClient.get<Supplier[]>('/suppliers', { params: { page, per_page: 20 } }),
  createSupplier: (data: Partial<Supplier>) => axiosClient.post('/suppliers', supplierFormData(data)),
  updateSupplier: (id: number, data: Partial<Supplier>) => axiosClient.post(`/suppliers/${id}`, supplierFormData(data, 'PUT')),
  deleteSupplier: (id: number) => axiosClient.delete(`/suppliers/${id}`),
  evaluateSupplier: (id: number, data: SupplierEvaluationInput) =>
    axiosClient.post(`/suppliers/${id}/evaluate`, data),
  getSupplierPurchaseHistory: (id: number) => axiosClient.get<PurchaseOrder[]>(`/suppliers/${id}/purchase-orders`),
  getSupplierCatalog: (id: number) => axiosClient.get<SupplierCatalogItem[]>(`/suppliers/${id}/catalog`),
  updateSupplierCatalog: (id: number, items: { item_type: 'supply' | 'tool'; item_id: number; unit_price: number }[]) =>
    axiosClient.put<SupplierCatalogItem[]>(`/suppliers/${id}/catalog`, { items }),
  getCertificateAlerts: () => axiosClient.get<CertificateAlert[]>('/suppliers-certificates/alerts'),
  getSupplierSpendSummary: () => axiosClient.get<SupplierSpendSummary>('/suppliers-spend-summary'),
  getInventorySupplies: () => axiosClient.get<SupplierCatalogItem[]>('/supplies'),
  getInventoryTools: () => axiosClient.get<SupplierCatalogItem[]>('/tools'),

  // ---- Órdenes de compra ----
  getPurchaseOrders: (page = 1) => axiosClient.get<PurchaseOrder[]>('/purchase-orders', { params: { page, per_page: 20 } }),
  createPurchaseOrder: (data: {
    supplier_id?: number; estimated_delivery_date?: string; items: PurchaseOrderItemInput[]; reconciles_existing_inventory?: boolean;
  }) => axiosClient.post<PurchaseOrder>('/purchase-orders', data),
  getPurchaseOrder: (id: number) => axiosClient.get<PurchaseOrder>(`/purchase-orders/${id}`),
  receivePurchaseOrder: (id: number, data: {
    quality_status: QualityStatus; observations?: string; photo_evidence_url?: string;
  }) => axiosClient.post(`/purchase-orders/${id}/receive`, data),
  getPendingDeliveries: (limit = 12) => axiosClient.get<PendingDeliveryItem[]>('/purchase-orders/pending-deliveries', { params: { limit } }),
  getAvailableInventoryItems: () => axiosClient.get<SupplierCatalogItem[]>('/purchase-orders/available-inventory-items'),
  getUnregisteredItems: () => axiosClient.get<UnregisteredItem[]>('/purchase-orders/unregistered-items'),

  // ---- Reporte de gasto en compras para el rango de fechas de una Meta de Producción ----
  getPurchaseSpendReport: (params: { start_date: string; end_date: string; label: string }) =>
    axiosClient.get<PurchaseSpendReport>('/purchase-orders/spend-report', { params }),
};
