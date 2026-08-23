import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ClientFormModal } from '../components/ClientFormModal';
import { useClientesViewModel } from '../viewmodels/useClientesViewModel';

export const ClientesPage: React.FC = () => {
  const {
    clients, isLoading, search, setSearch,
    isModalOpen, editingClient, form, setForm, isSaving,
    openCreate, openEdit, closeModal, handleSave, handleDelete,
  } = useClientesViewModel();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">Personas o corporaciones que reciben plántulas al registrar una salida.</p>
        </div>
        <Button onClick={openCreate}>Registrar cliente</Button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o cédula"
        className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">No hay clientes registrados todavía.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map(client => (
            <div key={client.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{client.name}</p>
                <p className="text-xs text-slate-400">Cédula {client.cedula} · Cel. {client.phone}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => openEdit(client)}>Editar</Button>
                <Button variant="danger" onClick={() => handleDelete(client)}>Eliminar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isEdit={editingClient !== null}
        form={form}
        setForm={setForm}
        isSaving={isSaving}
        onSubmit={handleSave}
      />
    </div>
  );
};
