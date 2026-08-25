import { useState, useCallback } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { inventoryService } from '../services/inventoryService';
import type { Movement } from '../types';

export function useMovementsViewModel() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { error } = useToast();

  const loadMovements = useCallback(async (page: number = 1, type?: string, q?: string, startDate?: string, endDate?: string) => {
    setIsLoading(true);
    try {
      const response = await inventoryService.getMovements(page, type, q, startDate, endDate);
      setMovements(response.data as any);
      if ((response as any).meta) {
        setPagination((response as any).meta);
      }
    } catch (e: any) {
      error('Error al cargar movimientos');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  return {
    movements,
    pagination,
    isLoading,
    loadMovements,
  };
}
