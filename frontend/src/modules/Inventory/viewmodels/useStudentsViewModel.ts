import { useState, useEffect, useCallback } from 'react';
import { studentService, type Student, type StudentFormData } from '../services/studentService';

import Swal from 'sweetalert2';

export const useStudentsViewModel = () => {
  const [students, setStudents] = useState<Student[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [semesterFilter, setSemesterFilter] = useState<number | ''>('');
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const studentsData = await studentService.getStudents({
        q: searchTerm || undefined,
        status: statusFilter || undefined,
        semester: semesterFilter || undefined
      });
      setStudents(studentsData.data);
    } catch (error) {
      console.error('Error loading students data', error);
      Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, semesterFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateStudent = async (data: StudentFormData) => {
    try {
      await studentService.createStudent(data);
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Estudiante registrado correctamente',
        timer: 1500,
        showConfirmButton: false
      });
      loadData();
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al registrar estudiante';
      Swal.fire('Error', msg, 'error');
      return false;
    }
  };

  const handleUpdateStudent = async (id: number, data: StudentFormData) => {
    try {
      await studentService.updateStudent(id, data);
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Estudiante actualizado correctamente',
        timer: 1500,
        showConfirmButton: false
      });
      loadData();
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al actualizar estudiante';
      Swal.fire('Error', msg, 'error');
      return false;
    }
  };

  const handleToggleStatus = async (student: Student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activar' : 'desactivar';
    const warningText = newStatus === 'inactive' 
      ? 'Los estudiantes inactivos no podrán solicitar nuevas herramientas.' 
      : 'El estudiante podrá solicitar herramientas nuevamente.';

    const { isConfirmed } = await Swal.fire({
      title: `¿Deseas ${actionText} a este estudiante?`,
      text: warningText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'active' ? '#10b981' : '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: newStatus === 'active' ? 'Activar' : 'Desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (isConfirmed) {
      try {
        await studentService.updateStatus(student.id, newStatus);
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: `Estudiante ${actionText}do correctamente`,
          timer: 1500,
          showConfirmButton: false
        });
        loadData();
      } catch (error) {
        Swal.fire('Error', `No se pudo ${actionText} al estudiante`, 'error');
      }
    }
  };

  return {
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
    refreshData: loadData
  };
};
