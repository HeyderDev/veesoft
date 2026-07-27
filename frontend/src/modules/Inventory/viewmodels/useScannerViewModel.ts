import { useState, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import type { Tool } from '../types';

export const useScannerViewModel = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchToolDetails = async (code: string) => {
    setLoadingCode(true);
    try {
      const tool = await inventoryService.getToolByCode(code);
      if (tool) {
        setSelectedTool(tool);
      } else {
        alert("Herramienta no encontrada");
      }
    } catch (error) {
      console.error(error);
      alert("Error al buscar la herramienta. Verifique que el código exista.");
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

  const registerEvent = async (tipo: 'BORROWED' | 'RETURN') => {
    if (!selectedTool) return;

    try {
      const status = tipo === 'BORROWED' ? 'BORROWED' : 'AVAILABLE';
      await inventoryService.updateToolStatus(selectedTool.id, status, {
        motivo: tipo === 'BORROWED' ? 'Préstamo por escáner' : 'Devolución por escáner'
      });
      
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
    successMessage,
    handleScan,
    handleManualSubmit,
    registerEvent
  };
};
