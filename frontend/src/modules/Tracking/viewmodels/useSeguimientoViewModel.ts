import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { TrackingItem, TrackingItemInput, TrackingStage } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const emptyForm: TrackingItemInput = {
  name: '', species: '', stage: 'germination', quantity: 0,
  unit: 'unidades', location: '', minimum_stock: 0, notes: '',
};

export function useSeguimientoViewModel() {
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<TrackingStage | ''>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrackingItem | null>(null);
  const [form, setForm] = useState<TrackingItemInput>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [qrItem, setQrItem] = useState<TrackingItem | null>(null);

  const { success, error } = useToast();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await trackingService.getTrackingItems({
        search: search || undefined,
        stage: stageFilter || undefined,
      });
      setItems(res.data || []);
    } catch (err) {
      error('Error al cargar el seguimiento de plántulas');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, stageFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (item: TrackingItem) => {
    setEditingItem(item);
    setForm({
      name: item.name, species: item.species, stage: item.stage, quantity: item.quantity,
      unit: item.unit, location: item.location, minimum_stock: item.minimum_stock,
      notes: item.notes ?? '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingItem) {
        const { quantity: _quantity, ...updatable } = form;
        await trackingService.updateTrackingItem(editingItem.id, updatable);
        success('Ítem actualizado');
      } else {
        await trackingService.createTrackingItem(form);
        success('Ítem registrado');
      }
      setIsModalOpen(false);
      await fetchItems();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo guardar el ítem'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: TrackingItem) => {
    try {
      await trackingService.deleteTrackingItem(item.id);
      success('Ítem eliminado');
      await fetchItems();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo eliminar el ítem'));
      console.error(err);
    }
  };

  return {
    items, isLoading, search, setSearch, stageFilter, setStageFilter,
    isModalOpen, editingItem, form, setForm, isSaving,
    openCreate, openEdit, closeModal, handleSave, handleDelete,
    qrItem, setQrItem,
  };
}
