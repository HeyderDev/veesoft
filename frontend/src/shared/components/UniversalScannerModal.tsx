import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { useQrScanner } from '../hooks/useQrScanner';

interface UniversalScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Solo decodifica y entrega el texto crudo — el ruteo (¿es un lote de
   * Seguimiento o un código de Inventario?) lo decide quien la use (ver
   * App.tsx), no este componente. */
  onDecode: (text: string) => void;
}

const CONTAINER_ID = 'universal-qr-reader';

/**
 * Botón central de la barra inferior móvil — un único escáner de cámara
 * (misma lógica compartida que WebScanner/CameraQrModal vía useQrScanner)
 * sin lógica de negocio propia.
 */
export const UniversalScannerModal: React.FC<UniversalScannerModalProps> = ({ isOpen, onClose, onDecode }) => {
  useQrScanner({
    containerId: CONTAINER_ID,
    isActive: isOpen,
    onDecode: text => {
      onDecode(text);
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Escanear código QR" subtitle="Apunta la cámara a un lote de Seguimiento o a un código de Inventario." maxWidthClassName="max-w-md">
      <div className="p-4">
        <div id={CONTAINER_ID} className="w-full rounded-lg overflow-hidden" />
      </div>
    </Modal>
  );
};
