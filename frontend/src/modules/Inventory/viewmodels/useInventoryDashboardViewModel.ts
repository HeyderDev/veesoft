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

  const totalTools = tools.length;
  const availableTools = tools.filter(t => t.status === 'AVAILABLE').length;
  const maintTools = tools.filter(t => t.status === 'MAINTENANCE').length;

  const totalSupplies = supplies.length;
  const criticalSupplies = supplies.filter(s => s.current_stock <= s.min_stock).length;

  const totalMovements = movements.length;

  // Encontrar prestamos no devueltos
  const overdueTools = movements
    .filter(m => m.type === 'BORROW' && !movements.some(ret => ret.type === 'RETURN' && ret.tool_id === m.tool_id && new Date(ret.created_at) > new Date(m.created_at)))
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
