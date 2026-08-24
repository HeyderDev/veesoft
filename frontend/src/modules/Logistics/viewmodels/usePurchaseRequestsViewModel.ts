import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { logisticsService } from '../services/logisticsService';
import type { PurchaseRequest, PurchaseRequestItemInput, Supplier, SupplierCatalogItem } from '../types';
import type { Supply, Tool } from '../../Inventory/types';
import { useAuth } from '../../../shared/context/AuthContext';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const emptyItem: PurchaseRequestItemInput = { item_type: 'supply', item_id: '', quantity: 1 };

export function usePurchaseRequestsViewModel(onApproved?: () => void) {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<SupplierCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, suppliersRes, suppliesRes, toolsRes] = await Promise.all([
        logisticsService.getPurchaseRequests(),
        isAdmin ? logisticsService.getSuppliers() : Promise.resolve({ data: [] as Supplier[] }),
        logisticsService.getInventorySupplies(),
        logisticsService.getInventoryTools(),
      ]);
      setRequests(requestsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      const supplies = (suppliesRes.data as unknown as Supply[] || []).map(supply => ({
        item_type: 'supply' as const, item_id: supply.id, code: supply.sku, name: supply.name, unit: supply.unit, unit_price: '0',
      }));
      const tools = (toolsRes.data as unknown as Tool[] || []).map(tool => ({
        item_type: 'tool' as const, item_id: tool.id, code: `HERR-${tool.id}`, name: tool.name, unit: 'unidad', unit_price: '0',
      }));
      setInventoryItems([...supplies, ...tools]);
    } catch (err) {
      error('Error al cargar las solicitudes de aprovisionamiento');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [isAdmin]);

  // ---- Solicitud: crear ----
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<PurchaseRequestItemInput[]>([{ ...emptyItem }]);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setReason('');
    setItems([{ ...emptyItem }]);
    setIsFormOpen(true);
  };
  const closeForm = () => setIsFormOpen(false);

  const addItemRow = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItemRow = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));
  const updateItemRow = (index: number, patch: Partial<PurchaseRequestItemInput>) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await logisticsService.createPurchaseRequest({ reason, items });
      success('Solicitud de aprovisionamiento registrada');
      await fetchAll();
      setIsFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al registrar la solicitud'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Solicitud: revisar (aprobar → genera orden, o rechazar) ----
  const [reviewTarget, setReviewTarget] = useState<PurchaseRequest | undefined>(undefined);
  const [reviewForm, setReviewForm] = useState<{
    supplier_id: number | ''; estimated_delivery_date: string;
  }>({ supplier_id: '', estimated_delivery_date: '' });
  const [isReviewing, setIsReviewing] = useState(false);

  const openReview = (request: PurchaseRequest) => {
    setReviewTarget(request);
    setReviewForm({
      supplier_id: '',
      estimated_delivery_date: '',
    });
  };
  const closeReview = () => setReviewTarget(undefined);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget || !reviewForm.supplier_id) return;
    setIsReviewing(true);
    try {
      await logisticsService.reviewPurchaseRequest(reviewTarget.id, {
        decision: 'approved',
        supplier_id: reviewForm.supplier_id,
        estimated_delivery_date: reviewForm.estimated_delivery_date || undefined,
      });
      success('Solicitud aprobada: orden de compra generada');
      await fetchAll();
      closeReview();
      onApproved?.();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al aprobar la solicitud'));
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReject = async (request: PurchaseRequest) => {
    setIsReviewing(true);
    try {
      await logisticsService.reviewPurchaseRequest(request.id, { decision: 'rejected' });
      success('Solicitud rechazada');
      await fetchAll();
      closeReview();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al rechazar la solicitud'));
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  };

  return {
    requests, suppliers, inventoryItems, isLoading, fetchAll,
    isFormOpen, openCreate, closeForm, reason, setReason, items, addItemRow, removeItemRow, updateItemRow, isSaving, handleSave,
    reviewTarget, openReview, closeReview, reviewForm, setReviewForm, isReviewing, handleApprove, handleReject,
  };
}
