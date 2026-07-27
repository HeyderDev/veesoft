import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { logisticsService } from '../services/logisticsService';
import type { Supplier, SupplierEvaluationInput } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

export function useSuppliersViewModel() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await logisticsService.getSuppliers();
      setSuppliers(response.data || []);
    } catch (err) {
      error('Error al cargar los proveedores');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  // ---- Proveedor: crear / editar ----
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>(undefined);
  const [form, setForm] = useState<Partial<Supplier>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editSupplier) {
      setForm(editSupplier);
    } else {
      setForm({ name: '', tax_id: '', email: '', phone: '', organic_certified: false });
    }
  }, [editSupplier, isFormOpen]);

  const openCreate = () => { setEditSupplier(undefined); setIsFormOpen(true); };
  const openEdit = (supplier: Supplier) => { setEditSupplier(supplier); setIsFormOpen(true); };
  const closeForm = () => setIsFormOpen(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editSupplier) {
        await logisticsService.updateSupplier(editSupplier.id, form);
        success('Proveedor actualizado correctamente');
      } else {
        await logisticsService.createSupplier(form);
        success('Proveedor registrado correctamente');
      }
      await fetchSuppliers();
      setIsFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al guardar el proveedor'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    try {
      await logisticsService.deleteSupplier(supplier.id);
      success('Proveedor eliminado');
      await fetchSuppliers();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo eliminar el proveedor'));
      console.error(err);
    }
  };

  // ---- Proveedor: evaluar (HU-03) ----
  const [isEvaluateOpen, setIsEvaluateOpen] = useState(false);
  const [evaluatingSupplier, setEvaluatingSupplier] = useState<Supplier | undefined>(undefined);
  const [evaluateForm, setEvaluateForm] = useState<SupplierEvaluationInput>({
    compliance: 5, quality: 5, punctuality: 5, price: 5, after_sales_service: 5, comment: '',
  });
  const [isEvaluating, setIsEvaluating] = useState(false);

  const openEvaluate = (supplier: Supplier) => {
    setEvaluatingSupplier(supplier);
    setEvaluateForm({ compliance: 5, quality: 5, punctuality: 5, price: 5, after_sales_service: 5, comment: '' });
    setIsEvaluateOpen(true);
  };
  const closeEvaluate = () => setIsEvaluateOpen(false);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingSupplier) return;
    setIsEvaluating(true);
    try {
      await logisticsService.evaluateSupplier(evaluatingSupplier.id, evaluateForm);
      success('Evaluación registrada y score recalculado');
      await fetchSuppliers();
      setIsEvaluateOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al registrar la evaluación'));
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return {
    suppliers, isLoading, fetchSuppliers,
    isFormOpen, editSupplier, openCreate, openEdit, closeForm, form, setForm, isSaving, handleSave, handleDelete,
    isEvaluateOpen, evaluatingSupplier, openEvaluate, closeEvaluate, evaluateForm, setEvaluateForm, isEvaluating, handleEvaluate,
  };
}
