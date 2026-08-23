import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { planningService } from '../services/planningService';
import type { Fase } from '../types';

export function useFasesViewModel(viveroId: number) {
  const [fasesData, setFasesData] = useState<Fase[]>([]);
  const [editFase, setEditFase] = useState<Fase | null>(null);
  const [hoveredFase, setHoveredFase] = useState<number | null>(null);
  const { success, error } = useToast();

  const fetchFases = async () => {
    try {
      const response = await planningService.getPhases();
      setFasesData(response.data || []);
    } catch (e) {
      console.error('Error fetching fases:', e);
    }
  };

  useEffect(() => {
    fetchFases();
  }, [viveroId]);

  const handleSaveFase = async (data: Partial<Fase>) => {
    try {
      if (editFase) {
        await planningService.updatePhase(editFase.id, data);
        success(
          editFase.code === 'DESP'
            ? 'Descripción actualizada'
            : 'Duración actualizada — los lotes con un ciclo en curso se reprogramaron desde su fase actual',
        );
        fetchFases();
      }
      setEditFase(null);
    } catch (e) {
      error('No se pudo actualizar la fase');
      console.error('Error saving fase:', e);
    }
  };

  // Despacho no tiene una duración fija (ver LotCycleService) — se excluye de la suma
  // de duración total; el ciclo real termina cuando se registra el despacho del lote.
  const duracionActual = fasesData.filter(f => f.code !== 'DESP').reduce((a, f) => a + f.estimated_duration_days, 0);
  const hasDespacho = fasesData.some(f => f.code === 'DESP');

  return {
    fasesData, editFase, setEditFase, hoveredFase, setHoveredFase,
    handleSaveFase, duracionActual, hasDespacho,
  };
}
