import { useState } from 'react';
import { Search, Plus, Upload, Download, UserX, UserCheck, Edit2 } from 'lucide-react';
import { useStudentsViewModel } from '../viewmodels/useStudentsViewModel';
import { StudentFormModal } from '../components/StudentFormModal';
import { ImportStudentsModal } from '../components/ImportStudentsModal';
import type { Student } from '../services/studentService';

export const StudentsPage = () => {
  const {
    students,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    semesterFilter,
    setSemesterFilter,
    handleCreateStudent,
    handleUpdateStudent,
    handleToggleStatus,
    refreshData
  } = useStudentsViewModel();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const openNewForm = () => {
    setSelectedStudent(null);
    setIsFormModalOpen(true);
  };

  const openEditForm = (student: Student) => {
    setSelectedStudent(student);
    setIsFormModalOpen(true);
  };

  const downloadTemplate = () => {
    const csvContent = "nombre,apellido,cedula,carrera,semestre\nJuan,Pérez,1312345678,Ingeniería Agropecuaria,5\nMaría,García,1312345679,Ingeniería Agropecuaria,6";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_estudiantes_vivero.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estudiantes</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestión del padrón de estudiantes autorizados para préstamos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={downloadTemplate}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Download size={16} /> Plantilla CSV
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Upload size={16} /> Importar CSV
          </button>
          <button 
            onClick={openNewForm}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={16} /> Nuevo Estudiante
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cédula o nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />
        </div>
        
        <select 
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value ? Number(e.target.value) : '')}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todos los semestres</option>
          {[1,2,3,4,5,6,7,8,9,10].map(s => (
            <option key={s} value={s}>Semestre {s}</option>
          ))}
        </select>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Estudiante</th>
                <th className="px-6 py-4">Cédula</th>
                <th className="px-6 py-4">Carrera</th>
                <th className="px-6 py-4">Semestre</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="mt-2 text-sm">Cargando estudiantes...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron estudiantes registrados.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{student.first_name} {student.last_name}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{student.cedula}</td>
                    <td className="px-6 py-4 text-slate-600">{student.career || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{student.semester}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {student.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditForm(student)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(student)}
                          className={`p-1.5 rounded transition-colors ${
                            student.status === 'active'
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={student.status === 'active' ? 'Desactivar' : 'Activar'}
                        >
                          {student.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormModalOpen && (
        <StudentFormModal 
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          student={selectedStudent}
          onSave={selectedStudent ? 
            (data) => handleUpdateStudent(selectedStudent.id, data) : 
            handleCreateStudent
          }
        />
      )}

      {isImportModalOpen && (
        <ImportStudentsModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
};
