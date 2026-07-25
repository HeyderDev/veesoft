import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { inventoryService } from '../services/inventoryService';
import type { Tool } from '../types';

export function useToolsViewModel() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const loadTools = useCallback(async (q?: string) => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getTools(q);
      setTools(data);
    } catch (e: any) {
      error('Error al cargar herramientas');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const handleCreate = async (data: Partial<Tool>) => {
    try {
      const createdTool = await inventoryService.createTool(data);
      success('Herramienta creada');
      loadTools();
      return createdTool;
    } catch (e: any) {
      error('Error al crear herramienta');
      return null;
    }
  };

  const handleUpdate = async (id: number, data: Partial<Tool>) => {
    try {
      await inventoryService.updateTool(id, data);
      success('Herramienta actualizada');
      loadTools();
    } catch (e: any) {
      error('Error al actualizar herramienta');
    }
  };

  const handleUpdateStatus = async (id: number, status: string, details?: any) => {
    try {
      await inventoryService.updateToolStatus(id, status, details);
      success('Estado actualizado');
      loadTools();
    } catch (e: any) {
      error('Error al actualizar estado');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await inventoryService.deleteTool(id);
      success('Herramienta eliminada');
      loadTools();
    } catch (e: any) {
      error('Error al eliminar herramienta');
    }
  };

  return {
    tools,
    isLoading,
    loadTools,
    handleCreate,
    handleUpdate,
    handleUpdateStatus,
    handleDelete,
  };
}
