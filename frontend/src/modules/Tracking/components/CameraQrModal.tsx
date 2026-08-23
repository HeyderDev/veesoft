import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';

interface CameraQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanLot: (lotId: number) => void;
}

const CONTAINER_ID = 'tracking-qr-reader';

export const CameraQrModal: React.FC<CameraQrModalProps> = ({ isOpen, onClose, onScanLot }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { error } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    if (scannerRef.current) return;

    let isScanProcessed = false;
    const container = document.getElementById(CONTAINER_ID);
    if (container) container.innerHTML = '';

    const html5QrCode = new Html5Qrcode(CONTAINER_ID);
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      decodedText => {
        if (isScanProcessed) return;

        const match = decodedText.match(/^tracking-lot:(\d+)$/);
        if (!match) {
          error('Este código QR no corresponde a un lote de Seguimiento');
          return;
        }

        isScanProcessed = true;
        if (html5QrCode.isScanning) html5QrCode.pause();
        onScanLot(Number(match[1]));
        onClose();
      },
      () => {
        // errores de frame individuales (sin QR visible) — se ignoran, es ruido normal.
      },
    ).catch(err => {
      console.error('Camera start error:', err);
      error('No se pudo iniciar la cámara');
    });

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(console.error);
        } else {
          scannerRef.current.clear();
        }
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Escanear código QR" maxWidthClassName="max-w-md">
      <div className="p-4">
        <div id={CONTAINER_ID} className="w-full rounded-lg overflow-hidden" />
      </div>
    </Modal>
  );
};
