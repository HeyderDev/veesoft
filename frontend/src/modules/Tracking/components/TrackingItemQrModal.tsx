import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import type { TrackingItem } from '../types';

interface TrackingItemQrModalProps {
  item: TrackingItem | null;
  onClose: () => void;
}

/**
 * Solo genera/muestra el QR para imprimir junto al lote — no incluye escaneo por
 * cámara (no aplica bien a un dashboard de escritorio, ver decisión de sesión).
 */
export const TrackingItemQrModal: React.FC<TrackingItemQrModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <Modal isOpen={!!item} onClose={onClose} title={item.name} maxWidthClassName="max-w-sm">
      <div className="p-6 flex flex-col items-center gap-4">
        <QRCodeSVG value={`tracking-item:${item.id}`} size={180} />
        <p className="text-xs text-slate-400 text-center">
          Imprime este código y pégalo junto al lote para identificarlo rápidamente.
        </p>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
};
