export type SupplierStatus = 'active' | 'inactive';

export interface SupplierEvaluation {
  id: number;
  supplier_id: number;
  evaluated_by: number | null;
  compliance: number;
  quality: number;
  punctuality: number;
  price: number;
  after_sales_service: number;
  comment: string | null;
  created_at?: string;
}

export interface SupplierEvaluationInput {
  compliance: number;
  quality: number;
  punctuality: number;
  price: number;
  after_sales_service: number;
  comment?: string;
}

/**
 * Nota de tipado: igual que en Planning, los campos `decimal:N` de Laravel llegan
 * como STRING en JSON (score, total, quantity, unit_price...), no como number.
 */
export interface Supplier {
  id: number;
  name: string;
  tax_id: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  organic_certified: boolean;
  certificate_expires_at: string | null;
  score: string;
  status: SupplierStatus;
  evaluations?: SupplierEvaluation[];
}

export interface SupplierCatalogItem {
  item_type: 'supply' | 'tool';
  item_id: number;
  code: string;
  name: string;
  unit: string;
  unit_price: string;
}

export interface CertificateAlert {
  supplier_id: number;
  supplier_name: string;
  certificate_expires_at: string;
  status: 'expired' | 'due_soon';
  days_remaining: number;
}

export type PurchaseOrderStatus = 'draft' | 'issued' | 'sent' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  supply_id: number | null;
  item_sku: string | null;
  item_name: string;
  unit: string;
  quantity: string;
  unit_price: string;
}

export interface PurchaseOrderItemInput {
  item_type: 'supply' | 'tool';
  item_id: number | '';
  quantity: number;
}

export interface UnregisteredItem {
  item_type: 'supply' | 'tool';
  item_id: number;
  sku: string | null;
  name: string;
  unit: string;
  /** Cantidad ya registrada en Inventory: la orden que reconcilia este aviso debe emitirse por esta misma cantidad, no editable. */
  quantity: string;
  /** ID de un proveedor que ya ofrece este ítem en su catálogo, si existe alguno. */
  supplier_id: number | null;
}

export type QualityStatus = 'approved' | 'rejected' | 'conditional';

export interface PurchaseReceipt {
  id: number;
  purchase_order_id: number;
  received_by: number | null;
  received_at: string;
  quality_status: QualityStatus;
  observations: string | null;
  photo_evidence_url: string | null;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  created_by: number | null;
  status: PurchaseOrderStatus;
  issued_at: string | null;
  estimated_delivery_date: string | null;
  total: string;
  supplier?: Supplier;
  creator?: { first_name: string; last_name: string };
  items?: PurchaseOrderItem[];
  receipt?: PurchaseReceipt | null;
}

export type DeliveryUrgency = 'red' | 'yellow' | 'green';

export interface PendingDeliveryItem {
  purchase_order_id: number;
  order_number: string;
  estimated_delivery_date: string | null;
  supplier_name: string;
  item_sku: string | null;
  item_name: string;
  unit: string;
  quantity: string;
  urgency: DeliveryUrgency;
}

export type PurchaseRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PurchaseRequestItem {
  id: number;
  purchase_request_id: number;
  supply_id: number | null;
  tool_id: number | null;
  item_sku: string | null;
  item_name: string;
  unit: string;
  quantity: string;
}

export interface PurchaseRequestItemInput {
  item_type: 'supply' | 'tool';
  item_id: number | '';
  quantity: number;
}

export interface PurchaseRequest {
  id: number;
  requested_by: number | null;
  reason: string;
  status: PurchaseRequestStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  purchase_order_id: number | null;
  items?: PurchaseRequestItem[];
  purchase_order?: PurchaseOrder;
}

/**
 * Reporte de gasto en compras (§ PurchaseSpendReportPanel): anual, o para el rango de
 * fechas de una Meta de Producción de Planning (`MetaProduccion`, ver ../../Planning/types)
 * que el frontend resuelve antes de pedir el reporte — Logistics no tiene su propio
 * concepto de "meta", reutiliza el que ya existe en Planning.
 */
export interface PurchaseSpendSupplier {
  supplier_id: number;
  supplier_name: string;
  orders_count: number;
  total_spent: string;
}

export interface PurchaseSpendReport {
  label: string;
  start_date: string;
  end_date: string;
  total_spent: string;
  orders_count: number;
  suppliers: PurchaseSpendSupplier[];
}
