import React, { useEffect, useState } from 'react';
import { Package, Search, Wrench } from 'lucide-react';
import type { AvailableResources, InventorySupply, InventoryTool } from '../types';
import { tasksService } from '../services/tasksService';

// ---- Componente para seleccionar herramientas e insumos ----
interface TaskResourcePickerProps {
  selectedResources: { type: 'tool' | 'supply', id: number, quantity?: number }[];
  onChange: (resources: { type: 'tool' | 'supply', id: number, quantity?: number }[]) => void;
}

export const TaskResourcePicker: React.FC<TaskResourcePickerProps> = ({ selectedResources, onChange }) => {
  const [resources, setResources] = useState<AvailableResources>({ tools: [], supplies: [] });
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

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

  const getSelected = (type: 'tool' | 'supply', id: number) =>
    selectedResources.find(r => r.type === type && r.id === id);

  const toggle = (type: 'tool' | 'supply', id: number) => {
    if (getSelected(type, id)) {
      onChange(selectedResources.filter(r => !(r.type === type && r.id === id)));
    } else {
      onChange([...selectedResources, { type, id, quantity: 1 }]);
    }
  };

  const updateQuantity = (type: 'tool' | 'supply', id: number, quantity: number) => {
    onChange(selectedResources.map(r => {
      if (r.type === type && r.id === id) {
        return { ...r, quantity };
      }
      return r;
    }));
  };

  if (isLoading) {
    return <div className="text-sm text-slate-400 py-2">Cargando recursos...</div>;
  }

  const filteredTools = resources.tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSupplies = resources.supplies.filter(supply =>
    supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supply.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar herramientas o insumos por nombre o código..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        />
      </div>

      {/* Herramientas */}
      {filteredTools.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> Herramientas disponibles</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredTools.map((tool: InventoryTool) => {
              const selected = getSelected('tool', tool.id);
              return (
                <div
                  key={`tool-${tool.id}`}
                  className={`flex flex-col gap-2 p-2.5 rounded-lg border text-sm transition-all ${
                    selected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selected}
                      onChange={() => toggle('tool', tool.id)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{tool.name}</p>
                      <p className="text-[10px] text-slate-400">{tool.code}</p>
                    </div>
                  </label>
                  {selected && (
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-xs text-emerald-600/80">Cantidad (uds):</span>
                      <input
                        type="number"
                        min={1}
                        step="1"
                        value={selected.quantity ?? 1}
                        onChange={e => updateQuantity('tool', tool.id, parseInt(e.target.value) || 1)}
                        className="w-20 rounded border border-emerald-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insumos */}
      {filteredSupplies.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Insumos disponibles</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredSupplies.map((supply: InventorySupply) => {
              const selected = getSelected('supply', supply.id);
              return (
                <div
                  key={`supply-${supply.id}`}
                  className={`flex flex-col gap-2 p-2.5 rounded-lg border text-sm transition-all ${
                    selected
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selected}
                      onChange={() => toggle('supply', supply.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{supply.name}</p>
                      <p className="text-[10px] text-slate-400">Stock: {supply.current_stock} {supply.unit}</p>
                    </div>
                  </label>
                  {selected && (
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-xs text-blue-600/80">Cant. ({supply.unit}):</span>
                      <input
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={selected.quantity ?? 1}
                        onChange={e => updateQuantity('supply', supply.id, parseFloat(e.target.value) || 1)}
                        className="w-20 rounded border border-blue-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredTools.length === 0 && filteredSupplies.length === 0 && (
        <p className="text-sm text-slate-400 italic text-center py-2">No se encontraron herramientas ni insumos que coincidan con la búsqueda.</p>
      )}
    </div>
  );
};
