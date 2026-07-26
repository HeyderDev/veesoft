import React, { useEffect, useState } from 'react';
import type { AvailableResources, InventorySupply, InventoryTool } from '../types';
import { tasksService } from '../services/tasksService';

// ---- Componente para seleccionar herramientas e insumos ----
interface TaskResourcePickerProps {
  selectedResources: { type: 'tool' | 'supply', id: number }[];
  onChange: (resources: { type: 'tool' | 'supply', id: number }[]) => void;
}

export const TaskResourcePicker: React.FC<TaskResourcePickerProps> = ({ selectedResources, onChange }) => {
  const [resources, setResources] = useState<AvailableResources>({ tools: [], supplies: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await tasksService.getAvailableResources() as unknown as { data: AvailableResources };
        setResources(res.data);
      } catch {
        console.error('Error al cargar recursos');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const isSelected = (type: 'tool' | 'supply', id: number) =>
    selectedResources.some(r => r.type === type && r.id === id);

  const toggle = (type: 'tool' | 'supply', id: number) => {
    if (isSelected(type, id)) {
      onChange(selectedResources.filter(r => !(r.type === type && r.id === id)));
    } else {
      onChange([...selectedResources, { type, id }]);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-slate-400 py-2">Cargando recursos...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Herramientas */}
      {resources.tools.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">🔧 Herramientas disponibles</h4>
          <div className="grid grid-cols-2 gap-1.5">
            {resources.tools.map((tool: InventoryTool) => (
              <label
                key={`tool-${tool.id}`}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
                  isSelected('tool', tool.id)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected('tool', tool.id)}
                  onChange={() => toggle('tool', tool.id)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="truncate">{tool.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Insumos */}
      {resources.supplies.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">📦 Insumos disponibles</h4>
          <div className="grid grid-cols-2 gap-1.5">
            {resources.supplies.map((supply: InventorySupply) => (
              <label
                key={`supply-${supply.id}`}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
                  isSelected('supply', supply.id)
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected('supply', supply.id)}
                  onChange={() => toggle('supply', supply.id)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="truncate">{supply.name} ({supply.current_stock} {supply.unit})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {resources.tools.length === 0 && resources.supplies.length === 0 && (
        <p className="text-sm text-slate-400 italic">No hay herramientas ni insumos registrados en el inventario.</p>
      )}
    </div>
  );
};
