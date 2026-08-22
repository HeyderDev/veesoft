import React, { useEffect, useRef, useState } from 'react';
import { trackingService } from '../services/trackingService';
import type { TrackingClient } from '../types';

interface ClientSearchSelectProps {
  value: TrackingClient | null;
  onChange: (client: TrackingClient | null) => void;
}

/**
 * Buscador de cliente por nombre o cédula — al seleccionar uno, muestra sus
 * datos (nombre + cédula) en vez del input de búsqueda.
 */
export const ClientSearchSelect: React.FC<ClientSearchSelectProps> = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackingClient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await trackingService.getClients(query || undefined);
      setResults(res.data || []);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen]);

  if (value) {
    return (
      <div className="flex items-center justify-between px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-slate-800">{value.name}</p>
          <p className="text-xs text-slate-500">Cédula: {value.cedula}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-emerald-700 hover:underline"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar cliente por nombre o cédula"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
      />
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">Sin resultados</p>
          ) : (
            results.map(client => (
              <button
                key={client.id}
                type="button"
                onClick={() => { onChange(client); setIsOpen(false); setQuery(''); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
              >
                <p className="font-medium text-slate-800">{client.name}</p>
                <p className="text-xs text-slate-500">{client.cedula}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
