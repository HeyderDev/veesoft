import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { planningService } from '../../Planning/services/planningService';
import type { MetaProduccion, Vivero } from '../../Planning/types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

/**
 * Configuración de meta de producción del vivero activo — migrado desde
 * Planning (ahora Configuración vive en el sidebar global, ver App.tsx).
 * Culminar y Eliminar ganan confirmación (antes eran un solo click directo).
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

  // ---- Culminar meta: doble confirmación con % de efectividad/déficit ----
  const [culminarStep, setCulminarStep] = useState<'preview' | 'confirm' | null>(null);
  const [isCulminando, setIsCulminando] = useState(false);

  const openCulminar = () => setCulminarStep('preview');
  const closeCulminar = () => setCulminarStep(null);
  const continueCulminar = () => setCulminarStep('confirm');
  const backToCulminarPreview = () => setCulminarStep('preview');

  const confirmCulminar = async () => {
    if (!currentMeta) return;
    setIsCulminando(true);
    try {
      await planningService.culminarGoal(currentMeta.id);
      success('Meta culminada. Ya puedes iniciar una nueva para este vivero.');
      await onChanged();
      setCulminarStep(null);
      setIsMetaFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo culminar la meta'));
      console.error(err);
    } finally {
      setIsCulminando(false);
    }
  };

  // ---- Eliminar meta (solo not_started) — antes sin confirmación ----
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteConfirm = () => setIsDeleteConfirmOpen(true);
  const closeDeleteConfirm = () => setIsDeleteConfirmOpen(false);

  const confirmDelete = async () => {
    if (!currentMeta) return;
    setIsDeleting(true);
    try {
      await planningService.deleteGoal(currentMeta.id);
      success('Meta eliminada');
      await onChanged();
      setIsDeleteConfirmOpen(false);
      setIsMetaFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo eliminar la meta'));
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    currentMeta, isMetaFormOpen, openMetaConfig, closeMetaForm,
    metaForm, setMetaForm, isSavingMeta, handleSaveMeta,
    culminarStep, openCulminar, closeCulminar, continueCulminar, backToCulminarPreview, isCulminando, confirmCulminar,
    isDeleteConfirmOpen, openDeleteConfirm, closeDeleteConfirm, isDeleting, confirmDelete,
  };
}
