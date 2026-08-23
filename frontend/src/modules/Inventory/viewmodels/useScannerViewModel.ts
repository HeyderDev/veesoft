import { useState, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import type { Tool } from '../types';

export const useScannerViewModel = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedSupply, setSelectedSupply] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const fetchToolDetails = async (code: string) => {
    setLoadingCode(true);
    try {
      if (code.startsWith('INS-')) {
        const supply = await inventoryService.getSupplyByCode(code);
        if (supply) {
          setSelectedSupply(supply);
        } else {
          alert("Insumo no encontrado");
        }
      } else {
        const tool = await inventoryService.getToolUnitByCode(code);
        if (tool) {
          setSelectedTool(tool);
        } else {
          alert("Herramienta no encontrada");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Error al buscar el código. Verifique que exista.");
    } finally {
      setLoadingCode(false);
    }
  };

  const findStudent = async (cedula: string) => {
    setLoadingCode(true);
    try {
      // Usamos el servicio ya configurado con Axios y headers
      const { studentService } = await import('../services/studentService');
      const response = await studentService.getStudents({ q: cedula });
      const match = response.data?.find((s: any) => s.cedula === cedula);
      if (match) {
        if (match.status === 'inactive') {
          alert("El estudiante está inactivo y no puede realizar préstamos.");
        } else {
          setSelectedStudent(match);
        }
      } else {
        alert("Estudiante no encontrado con esa cédula.");
      }
    } catch (error) {
      alert("Error al buscar estudiante.");
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
    }
  };

  const registerEvent = async (tipo: 'BORROWED' | 'RETURN', details: any) => {
    if (!selectedTool) return;

    try {
      const status = tipo === 'BORROWED' ? 'borrowed' : 'available';
      const eventDetails = { ...details };
      if (selectedStudent) {
        eventDetails.student_id = selectedStudent.id;
      }
      
      await inventoryService.updateToolUnitStatus(selectedTool.id, status, eventDetails);
      
      setSelectedTool(null);
      setSuccessMessage(`${tipo === 'BORROWED' ? 'Préstamo' : 'Devolución'} registrado exitosamente`);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error(error);
      alert("Error al registrar el evento.");
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
    selectedStudent,
    setSelectedStudent,
    successMessage,
    setSuccessMessage,
    handleScan,
    handleManualSubmit,
    registerEvent,
    findStudent
  };
};
