import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { inventoryService } from '../services/inventoryService';
import type { Supply } from '../types';

export function useSuppliesViewModel() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const loadSupplies = useCallback(async (q?: string) => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getSupplies(q);
      setSupplies(data);
    } catch (e: any) {
      error('Error al cargar insumos');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadSupplies();
  }, [loadSupplies]);

  const handleCreate = async (data: Partial<Supply>) => {
    try {
      const createdSupply = await inventoryService.createSupply(data);
      success('Insumo creado');
      loadSupplies();
      return createdSupply;
    } catch (e: any) {
      error('Error al crear insumo');
      return null;
    }
  };

  const handleUpdate = async (id: number, data: Partial<Supply>) => {
    try {
      await inventoryService.updateSupply(id, data);
      success('Insumo actualizado');
      loadSupplies();
    } catch (e: any) {
      error('Error al actualizar insumo');
    }
  };

  const handleAddStock = async (id: number, quantity: number, reason?: string) => {
    try {
      await inventoryService.registerSupplyMovement(id, 'ENTRADA', quantity, reason || 'Ingreso manual de stock');
      success('Stock agregado correctamente');
      loadSupplies();
    } catch (e: any) {
      error('Error al agregar stock');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await inventoryService.deleteSupply(id);
      success('Insumo eliminado');
      loadSupplies();
    } catch (e: any) {
      error('Error al eliminar insumo');
    }
  };

  const handlePrintLabel = async (name: string, code: string, format: 'qr' | 'barcode') => {
    try {
      await inventoryService.printLabel(name, code, format);
      success('Impresión enviada correctamente');
      return true;
    } catch (e: any) {
      error(e.response?.data?.message || 'No se pudo conectar con la impresora.');
      return false;
    }
  };

  return {
    supplies,
    isLoading,
    loadSupplies,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAddStock,
    handlePrintLabel,
  };
}
