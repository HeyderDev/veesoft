import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Student, StudentFormData } from '../services/studentService';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSave: (data: StudentFormData) => Promise<boolean>;
}

export const StudentFormModal: React.FC<Props> = ({ isOpen, onClose, student, onSave }) => {
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    cedula: '',
    career: 'Agropecuario',
    semester: 1,
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.first_name,
        last_name: student.last_name,
        cedula: student.cedula,
        career: student.career ?? 'Agropecuario',
        semester: student.semester,
        status: student.status
      });
    }
    // No dynamic careers needed; default is already set
    
  }, [student]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onSave(formData);
    setIsSubmitting(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {student ? 'Editar Estudiante' : 'Nuevo Estudiante'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="student-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cédula</label>
              <input
                type="text"
                required
                maxLength={10}
                minLength={10}
                pattern="\d{10}"
                title="Debe contener exactamente 10 dígitos numéricos"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                value={formData.cedula}
                onChange={e => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombres</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                />
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Carrera</label>
               <select
                 required
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                 value={formData.career}
                 onChange={e => setFormData({ ...formData, career: e.target.value })}
               >
                 <option value="Agropecuario">Agropecuario</option>
                 <option value="Agronomía">Agronomía</option>
               </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semestre</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                  value={formData.semester}
                  onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
                />
              </div>
              {student && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'active'|'inactive' })}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              )}
            </div>
            
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="student-form"
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
