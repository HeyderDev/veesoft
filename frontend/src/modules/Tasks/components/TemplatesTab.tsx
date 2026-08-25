import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { tasksService } from '../services/tasksService';
import { useAuth } from '../../../shared/context/AuthContext';
import { TaskResourcePicker } from './TaskResourcePicker';
import type { ActivityType } from '../types';

type ResourceInput = { type: 'tool' | 'supply'; id: number; quantity?: number };

export const TemplatesTab: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();
  const [templates, setTemplates] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActivityType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPriority, setDefaultPriority] = useState('normal');
  const [resources, setResources] = useState<ResourceInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await tasksService.getActivityTypes() as any;
      setTemplates(Array.isArray(res.data) ? res.data : res || []);
    } catch {
      error('Error al cargar las plantillas de actividad');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName('');
    setDescription('');
    setDefaultPriority('normal');
    setResources([]);
    setIsModalOpen(true);
  };

  const openEditModal = (tpl: ActivityType) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setDescription(tpl.description || '');
    setDefaultPriority(tpl.default_priority || 'normal');
    setResources((tpl.resources || []).map(r => ({ type: r.resource_type, id: r.resource_id, quantity: r.quantity })));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const payload = { name, description, default_priority: defaultPriority, resources };
      if (editingTemplate) {
        await tasksService.updateActivityType(editingTemplate.id, payload);
        success('Plantilla actualizada correctamente');
      } else {
        await tasksService.createActivityType(payload);
        success('Plantilla creada correctamente');
      }
      setIsModalOpen(false);
      loadTemplates();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al guardar la plantilla');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await tasksService.deleteActivityType(deletingId);
      success('Plantilla eliminada correctamente');
      setDeletingId(null);
      loadTemplates();
    } catch {
      error('Error al eliminar la plantilla');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Plantillas de Actividad</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define plantillas preestablecidas (nombre, prioridad, herramientas e insumos por defecto) para agilizar el registro de actividades.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} id="btn-new-template">
            <span className="mr-1.5">➕</span> Nueva Plantilla
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-6 w-full rounded" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic">No hay plantillas de actividad registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Recursos por defecto</th>
                  {isAdmin && <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {templates.map(tpl => (
                  <tr key={tpl.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{tpl.name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 max-w-md truncate">{tpl.description || <span className="text-slate-300 italic">Sin descripción</span>}</td>
                    <td className="px-5 py-3.5 text-xs">
                      {tpl.is_system ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Sistema (Fijo)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Personalizado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {tpl.resources && tpl.resources.length > 0 ? (
                        `${tpl.resources.length} recurso${tpl.resources.length === 1 ? '' : 's'}`
                      ) : (
                        <span className={tpl.is_system ? 'text-amber-600 font-medium' : 'text-slate-300 italic'}>
                          {tpl.is_system ? 'Sin definir — completar' : 'Ninguno'}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(tpl)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Editar plantilla"
                          >
                            ✏️
                          </button>
                          {!tpl.is_system ? (
                            <button
                              onClick={() => setDeletingId(tpl.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Eliminar plantilla"
                            >
                              🗑️
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic ml-1">No se puede eliminar</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? 'Editar Plantilla de Actividad' : 'Nueva Plantilla de Actividad'}
        subtitle={editingTemplate?.is_system ? 'Plantilla del sistema: el código interno no se puede cambiar, pero sí el resto de los datos.' : undefined}
      >
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej. Fertilización Foliar"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalle los objetivos o pasos generales de la plantilla..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioridad por defecto</label>
            <select
              value={defaultPriority}
              onChange={e => setDefaultPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Herramientas e Insumos por defecto</label>
            <TaskResourcePicker selectedResources={resources} onChange={setResources} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="Eliminar Plantilla"
        maxWidthClassName="max-w-sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            ¿Estás seguro de que deseas eliminar esta plantilla de actividad? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
