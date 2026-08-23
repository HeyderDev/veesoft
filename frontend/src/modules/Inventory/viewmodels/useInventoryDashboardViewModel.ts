import { useState, useEffect } from 'react';
import { useToolsViewModel } from './useToolsViewModel';
import { useSuppliesViewModel } from './useSuppliesViewModel';
import { useMovementsViewModel } from './useMovementsViewModel';

export function useInventoryDashboardViewModel() {
  const { tools, loadTools } = useToolsViewModel();
  const { supplies, loadSupplies } = useSuppliesViewModel();
  const { movements, loadMovements } = useMovementsViewModel();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([
        loadTools(),
        loadSupplies(),
        loadMovements()
      ]);
      setIsLoading(false);
    };
    fetchAll();
  }, [loadTools, loadSupplies, loadMovements]);

  const totalTools = tools.reduce((acc, t) => acc + (t.units_count || 0), 0);
  const availableTools = tools.reduce((acc, t) => acc + (t.available_units_count || 0), 0);
  const maintTools = tools.reduce((acc, t) => acc + (t.out_of_service_units_count || 0), 0);

  const totalSupplies = supplies.length;
  // Consider critical if available is less than 10% of total
  const criticalSupplies = supplies.filter(s => s.total_stock > 0 && s.current_stock <= (s.total_stock * 0.1)).length;

  const totalMovements = movements.length;

  // Encontrar prestamos no devueltos
  const overdueTools = movements
    .filter(m => (m.type === 'BORROW' || m.type === 'BORROWED') && !movements.some(ret => ret.type === 'RETURN' && ret.tool_id === m.tool_id && new Date(ret.created_at) > new Date(m.created_at)))
    .filter(m => {
        const diff = new Date().getTime() - new Date(m.created_at).getTime();
        const days = diff / (1000 * 3600 * 24);
        return days > 1; // Demorado más de 1 día
    });

  return {
    metrics: {
      totalTools,
      availableTools,
      maintTools,
      totalSupplies,
      criticalSupplies,
      totalMovements,
      overdueTools
    },
    recentMovements: movements.slice(0, 4),
    isLoading
  };
}
