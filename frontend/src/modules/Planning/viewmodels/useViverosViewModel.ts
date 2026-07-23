import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { planningService } from '../services/planningService';
import { usePlanningNav } from '../hooks/usePlanningNav';
import type { MetaProduccion, Vivero } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

export function useViverosViewModel() {
  // La lista de viveros vive en PlanningNavContext (compartida con el panel del
  // sidebar) — este viewmodel la reutiliza en vez de mantener su propia copia.
  const { viveros, isLoadingViveros: isLoading, refetchViveros: fetchViveros, setEnteredViveroId } = usePlanningNav();
  const { success, error } = useToast();

  // ---- Vivero: crear / editar ----
  const [isViveroFormOpen, setIsViveroFormOpen] = useState(false);
  const [editVivero, setEditVivero] = useState<Vivero | undefined>(undefined);
  const [viveroForm, setViveroForm] = useState<Partial<Vivero>>({});
  const [isSavingVivero, setIsSavingVivero] = useState(false);

  useEffect(() => {
    if (editVivero) {
      setViveroForm(editVivero);
    } else {
      setViveroForm({ name: '', location: '', responsible: '' });
    }
  }, [editVivero, isViveroFormOpen]);

  const openCreateVivero = () => { setEditVivero(undefined); setIsViveroFormOpen(true); };
  const openEditVivero = (vivero: Vivero) => { setEditVivero(vivero); setIsViveroFormOpen(true); };
  const closeViveroForm = () => setIsViveroFormOpen(false);

  const handleSaveVivero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVivero(true);
    try {
      if (editVivero) {
        await planningService.updateVivero(editVivero.id, viveroForm);
        success('Vivero actualizado correctamente');
      } else {
        await planningService.createVivero(viveroForm);
        success('Vivero creado correctamente');
      }
      fetchViveros();
      setIsViveroFormOpen(false);
    } catch (err) {
      error('Error al guardar el vivero');
      console.error(err);
    } finally {
      setIsSavingVivero(false);
    }
  };

  // ---- Meta: configurar (crear / editar / culminar / eliminar) ----
  const [isMetaFormOpen, setIsMetaFormOpen] = useState(false);
  const [activeVivero, setActiveVivero] = useState<Vivero | undefined>(undefined);
  const [metaForm, setMetaForm] = useState<Partial<MetaProduccion>>({});
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const currentMetaOf = (vivero?: Vivero): MetaProduccion | undefined => vivero?.metas?.[0];

  useEffect(() => {
    const meta = currentMetaOf(activeVivero);
    if (meta) {
      setMetaForm(meta);
    } else {
      setMetaForm({ title: '', description: '', target_seedlings: 100000 });
    }
  }, [activeVivero, isMetaFormOpen]);

  const openMetaConfig = (vivero: Vivero) => { setActiveVivero(vivero); setIsMetaFormOpen(true); };
  const closeMetaForm = () => setIsMetaFormOpen(false);

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVivero) return;
    setIsSavingMeta(true);
    const meta = currentMetaOf(activeVivero);
    try {
      if (meta) {
        await planningService.updateGoal(meta.id, {
          title: metaForm.title,
          description: metaForm.description,
          target_seedlings: metaForm.target_seedlings,
        });
        success('Meta actualizada correctamente');
      } else {
        await planningService.createGoal({ ...metaForm, vivero_id: activeVivero.id });
        success('Meta creada correctamente');
      }
      await fetchViveros();
      setIsMetaFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al guardar la meta'));
      console.error(err);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleCulminarMeta = async () => {
    const meta = currentMetaOf(activeVivero);
    if (!meta) return;
    try {
      await planningService.culminarGoal(meta.id);
      success('Meta culminada. Ya puedes iniciar una nueva para este vivero.');
      await fetchViveros();
      setIsMetaFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo culminar la meta'));
      console.error(err);
    }
  };

  const handleDeleteMeta = async () => {
    const meta = currentMetaOf(activeVivero);
    if (!meta) return;
    try {
      await planningService.deleteGoal(meta.id);
      success('Meta eliminada');
      await fetchViveros();
      setIsMetaFormOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo eliminar la meta'));
      console.error(err);
    }
  };

  return {
    viveros, isLoading, currentMetaOf, enterVivero: setEnteredViveroId,
    isViveroFormOpen, editVivero, openCreateVivero, openEditVivero, closeViveroForm,
    viveroForm, setViveroForm, isSavingVivero, handleSaveVivero,
    isMetaFormOpen, activeVivero, openMetaConfig, closeMetaForm,
    metaForm, setMetaForm, isSavingMeta, handleSaveMeta, handleCulminarMeta, handleDeleteMeta,
  };
}
