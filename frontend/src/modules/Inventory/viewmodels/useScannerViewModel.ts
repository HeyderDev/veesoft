import { useState, useCallback, useRef } from 'react';
import { inventoryService } from '../services/inventoryService';
import type { Tool } from '../types';

import Swal from 'sweetalert2';

export const useScannerViewModel = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedSupply, setSelectedSupply] = useState<any>(null);
  const [activeStudent, _setActiveStudent] = useState<any>(null);
  const activeStudentRef = useRef<any>(null);

  const setActiveStudent = (student: any) => {
    activeStudentRef.current = student;
    _setActiveStudent(student);
  };

  const fetchToolDetails = async (code: string) => {
    setLoadingCode(true);
    try {
      // 1. Check if it's a 10-digit number (Cedula Ecuatoriana)
      if (/^\d{10}$/.test(code)) {
        try {
          const student = await inventoryService.getStudentByCedula(code);
          setActiveStudent(student);
          setSuccessMessage(`Estudiante Activo: ${student.first_name} ${student.last_name}`);
          setTimeout(() => setSuccessMessage(null), 3000);
          return;
        } catch (e) {
          // Si no es estudiante, sigue intentando como herramienta
        }
      }

      if (!activeStudentRef.current) {
        Swal.fire('Atención', 'Ingrese estudiante primero', 'warning');
        return;
      }

      if (code.startsWith('INS-') || code.startsWith('SUP-')) {
        const supply = await inventoryService.getSupplyByCode(code);
        if (supply) {
          setSelectedSupply(supply);
        } else {
          Swal.fire('Error', 'Insumo no encontrado', 'error');
        }
      } else {
        const tool = await inventoryService.getToolUnitByCode(code);
        if (tool) {
          setSelectedTool(tool);
        } else {
          Swal.fire('Error', 'Herramienta no encontrada', 'error');
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Error al buscar el código. Verifique que exista.";
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleScan = useCallback((code: string) => {
    if (!code) return;
    setIsScanning(false);
    fetchToolDetails(code);
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
      setManualCode(''); // Clear the input after submission
    }
  };

  const registerEvent = async (tipo: 'BORROWED' | 'RETURN', details: any) => {
    if (!selectedTool) return;

    try {
      const status = tipo === 'BORROWED' ? 'borrowed' : 'available';

      const eventDetails = { ...details };
      if (activeStudentRef.current) {
        eventDetails.student_id = activeStudentRef.current.id;
        if (tipo === 'BORROWED') {
          eventDetails.motivo = details.motivo ? `${details.motivo} (Préstamo a ${activeStudentRef.current.first_name} ${activeStudentRef.current.last_name})` : `Préstamo a ${activeStudentRef.current.first_name} ${activeStudentRef.current.last_name}`;
        } else if (tipo === 'RETURN') {
          eventDetails.motivo = details.motivo ? `${details.motivo} (Devolución por ${activeStudentRef.current.first_name} ${activeStudentRef.current.last_name})` : `Devolución por ${activeStudentRef.current.first_name} ${activeStudentRef.current.last_name}`;
        }
      }

      await inventoryService.updateToolUnitStatus(selectedTool.id, status, eventDetails);
      
      setSelectedTool(null);
      setSuccessMessage(`${tipo === 'BORROWED' ? 'Préstamo' : 'Devolución'} registrado exitosamente`);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Error al registrar el evento.";
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  return {
    isScanning,
    setIsScanning,
    manualCode,
    setManualCode,
    loadingCode,
    selectedTool,
    setSelectedTool,
    selectedSupply,
    setSelectedSupply,
    activeStudent,
    setActiveStudent,
    successMessage,
    setSuccessMessage,
    handleScan,
    handleManualSubmit,
    registerEvent,
  };
};
