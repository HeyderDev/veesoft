import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { logisticsService } from '../services/logisticsService';
import type {
  PendingDeliveryItem, PurchaseOrder, PurchaseOrderItemInput, QualityStatus, Supplier, SupplierCatalogItem, UnregisteredItem,
} from '../types';
import { useAuth } from '../../../shared/context/AuthContext';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const emptyItem: PurchaseOrderItemInput = { item_type: 'supply', item_id: '', quantity: 1 };

export function usePurchaseOrdersViewModel() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDeliveryItem[]>([]);
  const [unregisteredItems, setUnregisteredItems] = useState<UnregisteredItem[]>([]);
  const [catalog, setCatalog] = useState<SupplierCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, suppliersRes, pendingRes, unregisteredRes] = await Promise.all([
        logisticsService.getPurchaseOrders(),
        isAdmin ? logisticsService.getSuppliers() : Promise.resolve({ data: [] as Supplier[] }),
        logisticsService.getPendingDeliveries(),
        logisticsService.getUnregisteredItems(),
      ]);
      setOrders(ordersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setPendingDeliveries(pendingRes.data || []);
      setUnregisteredItems(unregisteredRes.data || []);
    } catch (err) {
      error('Error al cargar las órdenes de compra');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [isAdmin]);

  // ---- Orden: crear ----
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<{ supplier_id: number | ''; estimated_delivery_date: string }>({
    supplier_id: '', estimated_delivery_date: '',
  });
  const [items, setItems] = useState<PurchaseOrderItemInput[]>([{ ...emptyItem }]);
  /**
   * Filas cuya cantidad no es editable, en paralelo a `items`: se activa para el ítem
   * que viene del aviso "Ítems sin orden de compra" (`openCreateForItem`) — la orden
   * que lo reconcilia debe emitirse exactamente por la cantidad ya registrada en
   * Inventory, para que lo comprado cuadre con lo que ya está físicamente ahí.
   */
  const [quantityLocked, setQuantityLocked] = useState<boolean[]>([false]);
  const [reconcilesExistingInventory, setReconcilesExistingInventory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setForm({ supplier_id: '', estimated_delivery_date: '' });
    setItems([{ ...emptyItem }]);
    setQuantityLocked([false]);
    setReconcilesExistingInventory(false);
    setCatalog([]);
    setIsFormOpen(true);
  };

  /**
   * Abre "Nueva Orden" con el proveedor y el ítem de la notificación de "Ítems
   * sin orden de compra" ya preseleccionados (solo aplica cuando ese ítem ya
   * está en el catálogo de al menos un proveedor, ver `supplier_id`). La cantidad
   * se fija a la ya registrada en Inventory y queda bloqueada (`quantityLocked`).
   */
  const openCreateForItem = (item: UnregisteredItem) => {
    if (!item.supplier_id) return;
    setForm({ supplier_id: item.supplier_id, estimated_delivery_date: '' });
    setItems([{ item_type: item.item_type, item_id: item.item_id, quantity: Number(item.quantity) }]);
    setQuantityLocked([true]);
    setReconcilesExistingInventory(true);
    setCatalog([]);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    // Restablecer el proveedor también es importante: si se abre luego una orden con
    // el mismo proveedor, el efecto de catálogo debe ejecutarse de nuevo y no dejar
    // el selector vacío con el texto "Selecciona un ítem".
    setIsFormOpen(false);
    setForm({ supplier_id: '', estimated_delivery_date: '' });
    setItems([{ ...emptyItem }]);
    setQuantityLocked([false]);
    setReconcilesExistingInventory(false);
    setCatalog([]);
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { ...emptyItem }]);
    setQuantityLocked(prev => [...prev, false]);
  };
  const removeItemRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    setQuantityLocked(prev => prev.filter((_, i) => i !== index));
  };
  const updateItemRow = (index: number, patch: Partial<PurchaseOrderItemInput>) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  useEffect(() => {
    if (!form.supplier_id) {
      setCatalog([]);
      return;
    }
    logisticsService.getSupplierCatalog(form.supplier_id)
      .then(response => setCatalog(response.data || []))
      .catch(err => {
        setCatalog([]);
        console.error(err);
      });
  }, [form.supplier_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_id) return;
    setIsSaving(true);
    try {
      await logisticsService.createPurchaseOrder({
        supplier_id: form.supplier_id,
        estimated_delivery_date: form.estimated_delivery_date || undefined,
        items,
        reconciles_existing_inventory: reconcilesExistingInventory,
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
    quality_status: QualityStatus; observations: string; photo_evidence_url: string;
  }>({ quality_status: 'approved', observations: '', photo_evidence_url: '' });
  const [isReceiving, setIsReceiving] = useState(false);

  const openReceive = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    setReceiveForm({ quality_status: 'approved', observations: '', photo_evidence_url: '' });
    setIsReceiveOpen(true);
  };
  const closeReceive = () => setIsReceiveOpen(false);

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingOrder) return;
    setIsReceiving(true);
    try {
      await logisticsService.receivePurchaseOrder(receivingOrder.id, {
        quality_status: receiveForm.quality_status,
        observations: receiveForm.observations || undefined,
        photo_evidence_url: receiveForm.photo_evidence_url || undefined,
      });
      success('Recepción registrada correctamente');
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
    orders, suppliers, pendingDeliveries, unregisteredItems, catalog, isLoading, fetchAll,
    isFormOpen, openCreate, openCreateForItem, closeForm, form, setForm, items, quantityLocked, reconcilesExistingInventory, addItemRow, removeItemRow, updateItemRow, isSaving, handleSave,
    isReceiveOpen, receivingOrder, openReceive, closeReceive, receiveForm, setReceiveForm, isReceiving, handleReceive,
  };
}
