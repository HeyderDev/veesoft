import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { logisticsService } from '../services/logisticsService';
import type { CertificateAlert, Supplier, SupplierCatalogItem, SupplierEvaluationInput } from '../types';
import type { Supply, Tool } from '../../Inventory/types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

export function useSuppliersViewModel() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [certificateAlerts, setCertificateAlerts] = useState<CertificateAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const [response, alertsResponse] = await Promise.all([
        logisticsService.getSuppliers(), logisticsService.getCertificateAlerts(),
      ]);
      setSuppliers(response.data || []);
      setCertificateAlerts(alertsResponse.data || []);
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

  // ---- Catálogo proveedor -> insumo ----
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSupplier, setCatalogSupplier] = useState<Supplier | undefined>();
  const [availableSupplies, setAvailableSupplies] = useState<SupplierCatalogItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<{ item_type: 'supply' | 'tool'; item_id: number | ''; unit_price: number }[]>([]);
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);

  const openCatalog = async (supplier: Supplier, presetItem?: { item_type: 'supply' | 'tool'; item_id: number }) => {
    setCatalogSupplier(supplier);
    setIsCatalogOpen(true);
    try {
      const [catalogResponse, suppliesResponse, toolsResponse] = await Promise.all([
        logisticsService.getSupplierCatalog(supplier.id), logisticsService.getInventorySupplies(), logisticsService.getInventoryTools(),
      ]);
      const supplies = (suppliesResponse.data as unknown as Supply[] || []).map(supply => ({ item_type: 'supply' as const, item_id: supply.id, code: supply.sku, name: supply.name, unit: supply.unit, unit_price: '0' }));
      const tools = (toolsResponse.data as unknown as Tool[] || []).map(tool => ({ item_type: 'tool' as const, item_id: tool.id, code: `HERR-${tool.id}`, name: tool.name, unit: 'unidad', unit_price: '0' }));
      setAvailableSupplies([...supplies, ...tools]);
      const items = (catalogResponse.data || []).map(item => ({
        item_type: item.item_type,
        item_id: item.item_id,
        unit_price: Number(item.unit_price),
      }));
      const alreadyLinked = presetItem && items.some(
        item => item.item_type === presetItem.item_type && item.item_id === presetItem.item_id
      );
      if (presetItem && !alreadyLinked) {
        items.push({ item_type: presetItem.item_type, item_id: presetItem.item_id, unit_price: 0 });
      }
      setCatalogItems(items);
    } catch (err) {
      error('No se pudo cargar el catálogo del proveedor');
      console.error(err);
    }
  };
  const closeCatalog = () => setIsCatalogOpen(false);
  const addCatalogItem = () => setCatalogItems(items => [...items, { item_type: 'supply', item_id: '', unit_price: 0 }]);
  const removeCatalogItem = (index: number) => setCatalogItems(items => items.filter((_, itemIndex) => itemIndex !== index));
  const updateCatalogItem = (index: number, patch: Partial<{ item_type: 'supply' | 'tool'; item_id: number | ''; unit_price: number }>) => {
    setCatalogItems(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };
  const saveCatalog = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!catalogSupplier || catalogItems.some(item => !item.item_id)) return;
    setIsSavingCatalog(true);
    try {
      await logisticsService.updateSupplierCatalog(catalogSupplier.id, catalogItems as { item_type: 'supply' | 'tool'; item_id: number; unit_price: number }[]);
      success('Catálogo del proveedor actualizado');
      setIsCatalogOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo actualizar el catálogo'));
      console.error(err);
    } finally {
      setIsSavingCatalog(false);
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
    suppliers, certificateAlerts, isLoading, fetchSuppliers,
    isFormOpen, editSupplier, openCreate, openEdit, closeForm, form, setForm, isSaving, handleSave, handleDelete,
    isEvaluateOpen, evaluatingSupplier, openEvaluate, closeEvaluate, evaluateForm, setEvaluateForm, isEvaluating, handleEvaluate,
    isCatalogOpen, catalogSupplier, availableSupplies, catalogItems, openCatalog, closeCatalog,
    addCatalogItem, removeCatalogItem, updateCatalogItem, saveCatalog, isSavingCatalog,
  };
}
