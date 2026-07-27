import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { TrackingItemFormModal } from '../components/TrackingItemFormModal';
import { TrackingItemQrModal } from '../components/TrackingItemQrModal';
import { useSeguimientoViewModel } from '../viewmodels/useSeguimientoViewModel';
import type { TrackingStage } from '../types';

const stageLabels: Record<TrackingStage, string> = {
  germination: 'Germinación',
  nursery: 'Vivero',
  transplant: 'Trasplante',
  ready_for_dispatch: 'Listo para entrega',
};

export const SeguimientoPage: React.FC = () => {
  const {
    items, isLoading, search, setSearch, stageFilter, setStageFilter,
    isModalOpen, editingItem, form, setForm, isSaving,
    openCreate, openEdit, closeModal, handleSave, handleDelete,
    qrItem, setQrItem,
  } = useSeguimientoViewModel();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Seguimiento de Plántulas</h1>
          <p className="text-sm text-slate-500 mt-1">Existencias por lote, etapa de crecimiento y ubicación.</p>
        </div>
        <Button onClick={openCreate}>Registrar lote</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, especie o ubicación"
          className="flex-1 min-w-[220px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        />
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value as TrackingStage | '')}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        >
          <option value="">Todas las etapas</option>
          {Object.entries(stageLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">No hay lotes registrados todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const lowStock = item.quantity <= item.minimum_stock;
            return (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <Badge variant={lowStock ? 'danger' : 'success'}>
                      {lowStock ? 'Stock bajo' : 'Stock ok'}
                    </Badge>
                    <Badge variant="info">{stageLabels[item.stage]}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.species} · {item.quantity} {item.unit} · {item.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setQrItem(item)}>QR</Button>
                  <Button variant="secondary" onClick={() => openEdit(item)}>Editar</Button>
                  <Button variant="danger" onClick={() => handleDelete(item)}>Eliminar</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TrackingItemFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingItem={editingItem}
        form={form}
        setForm={setForm}
        isSaving={isSaving}
        onSubmit={handleSave}
      />
      <TrackingItemQrModal item={qrItem} onClose={() => setQrItem(null)} />
    </div>
  );
};
