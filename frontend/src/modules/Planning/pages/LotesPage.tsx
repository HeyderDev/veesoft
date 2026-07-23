import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { LotDetailModal } from '../components/LotDetailModal';
import { LotFormModal } from '../components/LotFormModal';
import { LotWorkspace } from '../components/LotWorkspace';
import { useLotesViewModel } from '../viewmodels/useLotesViewModel';

interface LotesPageProps {
  viveroId: number;
}

export const LotesPage: React.FC<LotesPageProps> = ({ viveroId }) => {
  const {
    lotes, fases, isLoading,
    isCreateOpen, openCreate, closeCreate, createForm, setCreateForm, isSaving, handleCreate,
    selectedLot, openDetail, closeDetail,
    editForm, setEditForm, capacityInput, setCapacityInput, isSavingDetail,
    handleSaveEdit, handleUpdateCapacity, handleSetInactive, handleSetAvailable, handleDeleteLot,
    handleDragEnd,
    cycleStartDate, setCycleStartDate, startingPhaseId, setStartingPhaseId,
    isStartingCycle, handleStartCycle, handleTerminateDispatch,
  } = useLotesViewModel(viveroId);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lotes de Producción</h1>
          <p className="text-sm text-slate-500 mt-1">
            Desplaza el fondo o usa la rueda del mouse para navegar; arrastra un lote para ubicarlo como en tu campo real.
          </p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Lote
        </Button>
      </div>

      {/* Tablero */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : lotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🏗️</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No hay lotes configurados</h3>
          <p className="text-slate-500 mt-2 max-w-sm mb-6">
            Los lotes son los espacios físicos donde ubicarás las plántulas según su fase.
          </p>
          <Button onClick={openCreate} variant="secondary">
            Agregar mi primer lote
          </Button>
        </div>
      ) : (
        <LotWorkspace lots={lotes} onOpenDetail={openDetail} onDragEnd={handleDragEnd} />
      )}

      <LotFormModal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        form={createForm}
        setForm={setCreateForm}
        isSaving={isSaving}
        onSubmit={handleCreate}
      />

      <LotDetailModal
        lote={selectedLot}
        onClose={closeDetail}
        editForm={editForm}
        setEditForm={setEditForm}
        capacityInput={capacityInput}
        setCapacityInput={setCapacityInput}
        isSaving={isSavingDetail}
        onSaveEdit={handleSaveEdit}
        onUpdateCapacity={handleUpdateCapacity}
        onSetInactive={handleSetInactive}
        onSetAvailable={handleSetAvailable}
        onDelete={handleDeleteLot}
        fases={fases}
        cycleStartDate={cycleStartDate}
        setCycleStartDate={setCycleStartDate}
        startingPhaseId={startingPhaseId}
        setStartingPhaseId={setStartingPhaseId}
        isStartingCycle={isStartingCycle}
        onStartCycle={handleStartCycle}
        onTerminateDispatch={handleTerminateDispatch}
      />
    </div>
  );
};
