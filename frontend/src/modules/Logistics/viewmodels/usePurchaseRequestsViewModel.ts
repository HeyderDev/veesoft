import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { logisticsService } from '../services/logisticsService';
import type { PurchaseRequest, PurchaseRequestItemInput, Supplier } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const emptyItem: PurchaseRequestItemInput = { item_sku: '', item_name: '', unit: '', quantity: 1 };

export function usePurchaseRequestsViewModel() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, suppliersRes] = await Promise.all([
        logisticsService.getPurchaseRequests(),
        logisticsService.getSuppliers(),
      ]);
      setRequests(requestsRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (err) {
      error('Error al cargar las solicitudes de aprovisionamiento');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

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
    order_number: string; supplier_id: number | ''; estimated_delivery_date: string; unit_prices: Record<number, number>;
  }>({ order_number: '', supplier_id: '', estimated_delivery_date: '', unit_prices: {} });
  const [isReviewing, setIsReviewing] = useState(false);

  const openReview = (request: PurchaseRequest) => {
    setReviewTarget(request);
    setReviewForm({
      order_number: '',
      supplier_id: '',
      estimated_delivery_date: '',
      unit_prices: Object.fromEntries((request.items ?? []).map(item => [item.id, 0])),
    });
    logisticsService.getNextOrderNumber()
      .then(res => setReviewForm(prev => ({ ...prev, order_number: res.data?.order_number ?? '' })))
      .catch(err => console.error(err));
  };
  const closeReview = () => setReviewTarget(undefined);

  const setUnitPrice = (itemId: number, price: number) => {
    setReviewForm(prev => ({ ...prev, unit_prices: { ...prev.unit_prices, [itemId]: price } }));
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget || !reviewForm.supplier_id) return;
    setIsReviewing(true);
    try {
      await logisticsService.reviewPurchaseRequest(reviewTarget.id, {
        decision: 'approved',
        order_number: reviewForm.order_number,
        supplier_id: reviewForm.supplier_id,
        estimated_delivery_date: reviewForm.estimated_delivery_date || undefined,
        unit_prices: reviewForm.unit_prices,
      });
      success('Solicitud aprobada: orden de compra generada');
      await fetchAll();
      closeReview();
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
    requests, suppliers, isLoading, fetchAll,
    isFormOpen, openCreate, closeForm, reason, setReason, items, addItemRow, removeItemRow, updateItemRow, isSaving, handleSave,
    reviewTarget, openReview, closeReview, reviewForm, setReviewForm, setUnitPrice, isReviewing, handleApprove, handleReject,
  };
}
