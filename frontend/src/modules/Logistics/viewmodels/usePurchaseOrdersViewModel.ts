import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { logisticsService } from '../services/logisticsService';
import type {
  AvailableInventoryItem,
  PendingDeliveryItem,
  PurchaseOrder,
  PurchaseOrderItemInput,
  QualityStatus,
  Supplier,
  SupplierCatalogItem,
  UnregisteredItem,
} from '../types';
import { useAuth } from '../../../shared/context/AuthContext';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const emptyItem: PurchaseOrderItemInput = { item_type: 'supply', item_id: '', quantity: 1, unit_price: 0 };

export function usePurchaseOrdersViewModel() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDeliveryItem[]>([]);
  const [visiblePendingDeliveries, setVisiblePendingDeliveries] = useState(6);
  const [unregisteredItems, setUnregisteredItems] = useState<UnregisteredItem[]>([]);
  const [catalog, setCatalog] = useState<SupplierCatalogItem[]>([]);
  const [inventoryCatalog, setInventoryCatalog] = useState<AvailableInventoryItem[]>([]);
  const [isWithoutSupplier, setIsWithoutSupplier] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const { success, error } = useToast();

  const fetchAll = async (page = 1, append = false) => {
    append ? setIsLoadingMoreOrders(true) : setIsLoading(true);
    try {
      const [ordersRes, suppliersRes, pendingRes, unregisteredRes, inventoryRes] = await Promise.all([
        logisticsService.getPurchaseOrders(page),
        isAdmin ? logisticsService.getSuppliers() : Promise.resolve({ data: [] as Supplier[] }),
        logisticsService.getPendingDeliveries(12),
        logisticsService.getUnregisteredItems(),
        logisticsService.getAvailableInventoryItems(),
      ]);
      const ordersPageData = ordersRes as unknown as { data: PurchaseOrder[]; meta?: { current_page: number; last_page: number } };
      setOrders(previous => (append ? [...previous, ...(ordersPageData.data || [])] : ordersPageData.data || []));
      setOrdersPage(page);
      setHasMoreOrders((ordersPageData.meta?.current_page ?? page) < (ordersPageData.meta?.last_page ?? page));
      setSuppliers(suppliersRes.data || []);
      setPendingDeliveries(pendingRes.data || []);
      setVisiblePendingDeliveries(6);
      setUnregisteredItems(unregisteredRes.data || []);
      setInventoryCatalog(inventoryRes.data || []);
    } catch (err) {
      error('Error al cargar las órdenes de compra');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMoreOrders(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [isAdmin]);

  // ---- Orden: crear ----
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<{ supplier_id: number | ''; estimated_delivery_date: string }>({
    supplier_id: '',
    estimated_delivery_date: '',
  });
  const [items, setItems] = useState<PurchaseOrderItemInput[]>([{ ...emptyItem }]);
  const [quantityLocked, setQuantityLocked] = useState<boolean[]>([false]);
  const [reconcilesExistingInventory, setReconcilesExistingInventory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setForm({ supplier_id: '', estimated_delivery_date: '' });
    setItems([{ ...emptyItem }]);
    setQuantityLocked([false]);
    setReconcilesExistingInventory(false);
    setCatalog([]);
    setIsWithoutSupplier(false);
    setIsFormOpen(true);
  };

  /**
   * Abre "Nueva Orden" para conciliar un ítem no vinculado previamente.
   */
  const openCreateForItem = (item: UnregisteredItem) => {
    const withoutSupplier = !item.supplier_id;
    setForm({
      supplier_id: item.supplier_id ?? '',
      estimated_delivery_date: item.registered_at ?? '',
    });
    setItems([
      {
        item_type: item.item_type,
        item_id: item.item_id,
        quantity: Number(item.quantity),
        ...(withoutSupplier ? { unit_price: 0 } : {}),
      },
    ]);
    setQuantityLocked([true]);
    setReconcilesExistingInventory(true);
    setCatalog([]);
    setIsWithoutSupplier(withoutSupplier);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setForm({ supplier_id: '', estimated_delivery_date: '' });
    setItems([{ ...emptyItem }]);
    setQuantityLocked([false]);
    setReconcilesExistingInventory(false);
    setCatalog([]);
    setIsWithoutSupplier(false);
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
    if (!form.supplier_id || isWithoutSupplier) {
      setCatalog([]);
      return;
    }
    logisticsService
      .getSupplierCatalog(form.supplier_id)
      .then(response => setCatalog(response.data || []))
      .catch(err => {
        setCatalog([]);
        console.error(err);
      });
  }, [form.supplier_id, isWithoutSupplier]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWithoutSupplier && !form.supplier_id) return;
    setIsSaving(true);
    try {
      await logisticsService.createPurchaseOrder({
        supplier_id: isWithoutSupplier ? undefined : (form.supplier_id || undefined),
        estimated_delivery_date: form.estimated_delivery_date || undefined,
        items,
        reconciles_existing_inventory: reconcilesExistingInventory,
      });
      success('Orden de compra generada exitosamente');
      await fetchAll();
      window.dispatchEvent(new CustomEvent('logistics:spend-updated'));
      closeForm();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al generar la orden de compra'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Orden: recibir ----
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | undefined>(undefined);
  const [receiveForm, setReceiveForm] = useState<{
    quality_status: QualityStatus;
    observations: string;
    photo_evidence_url: string;
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
      window.dispatchEvent(new CustomEvent('logistics:spend-updated'));
      setIsReceiveOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al registrar la recepción'));
      console.error(err);
    } finally {
      setIsReceiving(false);
    }
  };

  return {
    orders,
    suppliers,
    pendingDeliveries,
    visiblePendingDeliveries,
    loadMorePendingDeliveries: () => setVisiblePendingDeliveries(current => Math.min(current + 6, 12)),
    unregisteredItems,
    catalog,
    inventoryCatalog,
    isWithoutSupplier,
    setIsWithoutSupplier,
    isLoading,
    hasMoreOrders,
    isLoadingMoreOrders,
    loadMoreOrders: () => fetchAll(ordersPage + 1, true),
    fetchAll,
    isFormOpen,
    openCreate,
    openCreateForItem,
    closeForm,
    form,
    setForm,
    items,
    setItems,
    quantityLocked,
    reconcilesExistingInventory,
    addItemRow,
    removeItemRow,
    updateItemRow,
    isSaving,
    handleSave,
    isReceiveOpen,
    receivingOrder,
    openReceive,
    closeReceive,
    receiveForm,
    setReceiveForm,
    isReceiving,
    handleReceive,
  };
}
