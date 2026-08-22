import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { TrackingClient, TrackingClientInput } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }).response;
    const firstFieldError = response?.data?.errors ? Object.values(response.data.errors)[0]?.[0] : undefined;
    if (firstFieldError) return firstFieldError;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const emptyForm: TrackingClientInput = { name: '', cedula: '', phone: '' };

export function useClientesViewModel() {
  const [clients, setClients] = useState<TrackingClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<TrackingClient | null>(null);
  const [form, setForm] = useState<TrackingClientInput>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useToast();

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await trackingService.getClients(search || undefined);
      setClients(res.data || []);
    } catch (err) {
      error('Error al cargar los clientes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (client: TrackingClient) => {
    setEditingClient(client);
    setForm({ name: client.name, cedula: client.cedula, phone: client.phone });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingClient) {
        await trackingService.updateClient(editingClient.id, form);
        success('Cliente actualizado');
      } else {
        await trackingService.createClient(form);
        success('Cliente registrado');
      }
      setIsModalOpen(false);
      await fetchClients();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo guardar el cliente'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (client: TrackingClient) => {
    try {
      await trackingService.deleteClient(client.id);
      success('Cliente eliminado');
      await fetchClients();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo eliminar el cliente'));
      console.error(err);
    }
  };

  return {
    clients, isLoading, search, setSearch,
    isModalOpen, editingClient, form, setForm, isSaving,
    openCreate, openEdit, closeModal, handleSave, handleDelete,
  };
}
