import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { planningService } from '../services/planningService';
import type { Fase } from '../types';
import { isGatedPhaseCode } from '../types';

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
          isGatedPhaseCode(editFase.code)
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

  // Siembra, Injertación y Despacho no tienen una duración fija (ver
  // LotCycleService/GatedPhaseCatalog) — se excluyen de la suma de duración total;
  // cada una termina cuando se confirma su actividad obligatoria en Tareas.
  const duracionActual = fasesData.filter(f => !isGatedPhaseCode(f.code)).reduce((a, f) => a + f.estimated_duration_days, 0);
  const gatedPhases = fasesData.filter(f => isGatedPhaseCode(f.code));

  return {
    fasesData, editFase, setEditFase, hoveredFase, setHoveredFase,
    handleSaveFase, duracionActual, gatedPhases,
  };
}
