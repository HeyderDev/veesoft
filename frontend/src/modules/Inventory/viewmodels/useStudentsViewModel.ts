import { useState, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import type { Student } from '../types';
import Swal from 'sweetalert2';
import { useToast } from '../../../components/ui/Toast';

export const useStudentsViewModel = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { error: toastError } = useToast();

  const loadStudents = useCallback(async (q?: string) => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getStudents(q);
      setStudents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Ocurrió un error al cargar los estudiantes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreate = async (data: Partial<Student>) => {
    try {
      const created = await inventoryService.createStudent(data);
      setStudents(prev => [created, ...prev]);
      return created;
    } catch (error: any) {
      if (error.response?.status === 422) {
        const firstError = Object.values(error.response.data.errors)[0] as string[];
        Swal.fire('Error de validación', firstError[0], 'error');
      } else {
        toastError(error.response?.data?.message || 'Ocurrió un error');
      }
      return null;
    }
  };

  const handleUpdate = async (id: number, data: Partial<Student>) => {
    try {
      const updated = await inventoryService.updateStudent(id, data);
      setStudents(prev => prev.map(item => item.id === id ? updated : item));
      Swal.fire('¡Actualizado!', 'Datos del estudiante actualizados correctamente.', 'success');
      return updated;
    } catch (error: any) {
      if (error.response?.status === 422) {
        const firstError = Object.values(error.response.data.errors)[0] as string[];
        Swal.fire('Error de validación', firstError[0], 'error');
      } else {
        toastError(error.response?.data?.message || 'Ocurrió un error');
      }
      return null;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await inventoryService.deleteStudent(id);
      setStudents(prev => prev.filter(item => item.id !== id));
      Swal.fire('¡Eliminado!', 'El estudiante ha sido eliminado.', 'success');
      return true;
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Ocurrió un error al eliminar el estudiante');
      return false;
    }
  };

  const handleImportCsv = async (file: File) => {
    setIsLoading(true);
    try {
      const response = await inventoryService.importStudents(file);
      Swal.fire('¡Importación completada!', `${response.inserted} estudiantes registrados. ${response.errors?.length ? 'Hubo algunos errores, revisa la consola para más detalles.' : ''}`, 'success');
      if (response.errors?.length) {
        console.warn('Errores de importación:', response.errors);
      }
      loadStudents();
      return true;
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Error al importar archivo CSV');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validateEcuadorianCedula = (cedula: string) => {
    if (cedula.length !== 10 || !/^\d+$/.test(cedula)) return false;
    
    const prov = parseInt(cedula.substring(0, 2), 10);
    if (prov < 1 || prov > 24) return false;
    
    const thirdDigit = parseInt(cedula[2], 10);
    if (thirdDigit >= 6) return false;
    
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula[i], 10) * coeficientes[i];
      if (valor > 9) valor -= 9;
      suma += valor;
    }
    
    const decenaSuperior = Math.ceil(suma / 10) * 10;
    let digitoVerificador = decenaSuperior - suma;
    if (digitoVerificador === 10) digitoVerificador = 0;
    
    return digitoVerificador === parseInt(cedula[9], 10);
  };

  return {
    students,
    isLoading,
    loadStudents,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleImportCsv,
    validateEcuadorianCedula
  };
};
