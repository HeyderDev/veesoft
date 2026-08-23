import { useEffect, useState } from 'react';
import { useToast } from '../../components/ui/Toast';
import { planningService } from '../../modules/Planning/services/planningService';
import type { Vivero } from '../../modules/Planning/types';

/**
 * Formulario de creación/edición de un vivero (sin meta de producción — eso
 * es responsabilidad de Planning). Compartido entre ViveroGate (elegir/crear
 * al entrar al sistema) y la página de Configuración de Planning (editar el
 * vivero activo), para no duplicar esta lógica en los dos lugares.
 */
export function useViveroFormViewModel(onSaved?: () => void | Promise<void>) {
  const { success, error } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVivero, setEditingVivero] = useState<Vivero | undefined>(undefined);
  const [form, setForm] = useState<Partial<Vivero>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingVivero) {
      setForm(editingVivero);
    } else {
      setForm({ name: '', location: '', responsible: '' });
    }
  }, [editingVivero, isFormOpen]);

  const openCreate = () => { setEditingVivero(undefined); setIsFormOpen(true); };
  const openEdit = (vivero: Vivero) => { setEditingVivero(vivero); setIsFormOpen(true); };
  const closeForm = () => setIsFormOpen(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingVivero) {
        await planningService.updateVivero(editingVivero.id, form);
        success('Vivero actualizado correctamente');
      } else {
        await planningService.createVivero(form);
        success('Vivero creado correctamente');
      }
      await onSaved?.();
      setIsFormOpen(false);
    } catch (err) {
      error('Error al guardar el vivero');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isFormOpen, editingVivero, form, setForm, isSaving,
    openCreate, openEdit, closeForm, handleSave,
  };
}
