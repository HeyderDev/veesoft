import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { useQrScanner } from '../../../shared/hooks/useQrScanner';

interface CameraQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanLot: (lotId: number) => void;
}

const CONTAINER_ID = 'tracking-qr-reader';

export const CameraQrModal: React.FC<CameraQrModalProps> = ({ isOpen, onClose, onScanLot }) => {
  const { error } = useToast();

  const { resume } = useQrScanner({
    containerId: CONTAINER_ID,
    isActive: isOpen,
    onDecode: decodedText => {
      const match = decodedText.match(/^tracking-lot:(\d+)$/);
      if (!match) {
        error('Este código QR no corresponde a un lote de Seguimiento');
        resume();
        return;
      }
      onScanLot(Number(match[1]));
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Escanear código QR" maxWidthClassName="max-w-md">
      <div className="p-4">
        <div id={CONTAINER_ID} className="w-full rounded-lg overflow-hidden" />
      </div>
    </Modal>
  );
};
