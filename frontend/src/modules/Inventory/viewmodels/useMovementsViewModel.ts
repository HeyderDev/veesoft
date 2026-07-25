import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { inventoryService } from '../services/inventoryService';
import type { Movement } from '../types';

export function useMovementsViewModel() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { error } = useToast();

  const loadMovements = useCallback(async (type?: string, q?: string, startDate?: string, endDate?: string) => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getMovements(type, q, startDate, endDate);
      setMovements(data);
    } catch (e: any) {
      error('Error al cargar movimientos');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  return {
    movements,
    isLoading,
    loadMovements,
  };
}
