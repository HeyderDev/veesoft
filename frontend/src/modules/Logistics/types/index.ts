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

export interface SupplierCertification {
  has_certificate: boolean;
  certificate_number?: string | null;
  certifying_entity?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
  file_path?: string | null;
  file?: File | null;
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
  certification?: SupplierCertification | null;
}

export interface SupplierCatalogItem {
  item_type: 'supply' | 'tool';
  item_id: number;
  code: string;
  name: string;
  unit: string;
  unit_price: string;
}

export interface AvailableInventoryItem {
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
  tool_id: number | null;
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
  unit_price?: number;
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
  /** Fecha del primer registro no vinculado en inventario. */
  registered_at?: string | null;
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
  supplier_id: number | null;
  created_by: number | null;
  status: PurchaseOrderStatus;
  issued_at: string | null;
  estimated_delivery_date: string | null;
  total: string;
  reconciles_existing_inventory?: boolean;
  supplier?: Supplier | null;
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

/**
 * Reporte de Proveedores (§ SupplierSpendReportPanel): cuántos proveedores hay
 * registrados y cuánto se le ha comprado a cada uno históricamente — a diferencia de
 * `PurchaseSpendReport`, no está acotado a ningún período.
 */
export interface SupplierSpend {
  supplier_id: number;
  supplier_name: string;
  status: SupplierStatus;
  orders_count: number;
  total_spent: string;
}

export interface SupplierSpendSummary {
  total_suppliers: number;
  suppliers: SupplierSpend[];
}
