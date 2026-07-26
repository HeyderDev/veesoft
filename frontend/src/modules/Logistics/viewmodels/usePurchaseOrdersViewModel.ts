import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { logisticsService } from '../services/logisticsService';
import type {
  PendingDeliveryItem, PurchaseOrder, PurchaseOrderItemInput, QualityStatus, Supplier,
} from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const emptyItem: PurchaseOrderItemInput = { item_sku: '', item_name: '', unit: '', quantity: 1, unit_price: 0 };

export function usePurchaseOrdersViewModel() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, suppliersRes, pendingRes] = await Promise.all([
        logisticsService.getPurchaseOrders(),
        logisticsService.getSuppliers(),
        logisticsService.getPendingDeliveries(),
      ]);
      setOrders(ordersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setPendingDeliveries(pendingRes.data || []);
    } catch (err) {
      error('Error al cargar las órdenes de compra');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ---- Orden: crear ----
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<{ order_number: string; supplier_id: number | ''; estimated_delivery_date: string }>({
    order_number: '', supplier_id: '', estimated_delivery_date: '',
  });
  const [items, setItems] = useState<PurchaseOrderItemInput[]>([{ ...emptyItem }]);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setForm({ order_number: '', supplier_id: '', estimated_delivery_date: '' });
    setItems([{ ...emptyItem }]);
    setIsFormOpen(true);
    logisticsService.getNextOrderNumber()
      .then(res => setForm(prev => ({ ...prev, order_number: res.data?.order_number ?? '' })))
      .catch(err => console.error(err));
  };
  const closeForm = () => setIsFormOpen(false);

  const addItemRow = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItemRow = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));
  const updateItemRow = (index: number, patch: Partial<PurchaseOrderItemInput>) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_id) return;
    setIsSaving(true);
    try {
      await logisticsService.createPurchaseOrder({
        order_number: form.order_number,
        supplier_id: form.supplier_id,
        estimated_delivery_date: form.estimated_delivery_date || undefined,
        items,
      });
      success('Orden de compra generada exitosamente');
      await fetchAll();
      setIsFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al generar la orden de compra'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Orden: recibir (HU-06) ----
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | undefined>(undefined);
  const [receiveForm, setReceiveForm] = useState<{
    quality_status: QualityStatus; substrate_temperature: string; observations: string; photo_evidence_url: string;
  }>({ quality_status: 'approved', substrate_temperature: '', observations: '', photo_evidence_url: '' });
  const [isReceiving, setIsReceiving] = useState(false);

  const openReceive = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    setReceiveForm({ quality_status: 'approved', substrate_temperature: '', observations: '', photo_evidence_url: '' });
    setIsReceiveOpen(true);
  };
  const closeReceive = () => setIsReceiveOpen(false);

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingOrder) return;
    setIsReceiving(true);
    try {
      const response = await logisticsService.receivePurchaseOrder(receivingOrder.id, {
        quality_status: receiveForm.quality_status,
        substrate_temperature: receiveForm.substrate_temperature ? Number(receiveForm.substrate_temperature) : undefined,
        observations: receiveForm.observations || undefined,
        photo_evidence_url: receiveForm.photo_evidence_url || undefined,
      });
      const warning = (response.data as { temperature_warning?: string | null })?.temperature_warning;
      success(warning || 'Recepción registrada correctamente');
      await fetchAll();
      setIsReceiveOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al registrar la recepción'));
      console.error(err);
    } finally {
      setIsReceiving(false);
    }
  };

  return {
    orders, suppliers, pendingDeliveries, isLoading, fetchAll,
    isFormOpen, openCreate, closeForm, form, setForm, items, addItemRow, removeItemRow, updateItemRow, isSaving, handleSave,
    isReceiveOpen, receivingOrder, openReceive, closeReceive, receiveForm, setReceiveForm, isReceiving, handleReceive,
  };
}
