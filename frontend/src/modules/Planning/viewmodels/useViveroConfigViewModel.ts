import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { planningService } from '../services/planningService';
import type { MetaProduccion, Vivero } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

/**
 * Configuración de meta de producción del vivero activo. Sustituye a la mitad
 * "meta" de la antigua useViverosViewModel (la mitad "crear/editar vivero" la
 * cubre ahora shared/hooks/useViveroFormViewModel, reutilizado en ConfiguracionPage).
 */
export function useViveroConfigViewModel(vivero: Vivero, onChanged: () => Promise<void>) {
  const { success, error } = useToast();

  const [isMetaFormOpen, setIsMetaFormOpen] = useState(false);
  const [metaForm, setMetaForm] = useState<Partial<MetaProduccion>>({});
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const currentMeta = vivero.metas?.[0];

  useEffect(() => {
    if (currentMeta) {
      setMetaForm(currentMeta);
    } else {
      setMetaForm({ title: '', description: '', target_seedlings: 100000 });
    }
  }, [currentMeta, isMetaFormOpen]);

  const openMetaConfig = () => setIsMetaFormOpen(true);
  const closeMetaForm = () => setIsMetaFormOpen(false);

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMeta(true);
    try {
      if (currentMeta) {
        await planningService.updateGoal(currentMeta.id, {
          title: metaForm.title,
          description: metaForm.description,
          target_seedlings: metaForm.target_seedlings,
        });
        success('Meta actualizada correctamente');
      } else {
        await planningService.createGoal({ ...metaForm, vivero_id: vivero.id });
        success('Meta creada correctamente');
      }
      await onChanged();
      setIsMetaFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al guardar la meta'));
      console.error(err);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleCulminarMeta = async () => {
    if (!currentMeta) return;
    try {
      await planningService.culminarGoal(currentMeta.id);
      success('Meta culminada. Ya puedes iniciar una nueva para este vivero.');
      await onChanged();
      setIsMetaFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo culminar la meta'));
      console.error(err);
    }
  };

  const handleDeleteMeta = async () => {
    if (!currentMeta) return;
    try {
      await planningService.deleteGoal(currentMeta.id);
      success('Meta eliminada');
      await onChanged();
      setIsMetaFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo eliminar la meta'));
      console.error(err);
    }
  };

  return {
    currentMeta, isMetaFormOpen, openMetaConfig, closeMetaForm,
    metaForm, setMetaForm, isSavingMeta, handleSaveMeta, handleCulminarMeta, handleDeleteMeta,
  };
}
