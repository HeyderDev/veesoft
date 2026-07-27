import React, { useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import type { TrackingLot } from '../types';

interface LotQrModalProps {
  lot: TrackingLot | null;
  onClose: () => void;
}

/**
 * El valor codificado depende únicamente del id del lote (inmutable en
 * Planning), así que el QR generado es siempre el mismo para ese lote —
 * no se persiste nada nuevo, se deriva de forma determinística.
 */
function qrValueForLot(lotId: number): string {
  return `tracking-lot:${lotId}`;
}

export const LotQrModal: React.FC<LotQrModalProps> = ({ lot, onClose }) => {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  if (!lot) return null;

  const downloadSvg = () => {
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const serialized = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([serialized], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-lote-${lot.code}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadJpg = () => {
    const canvasEl = canvasContainerRef.current?.querySelector('canvas');
    if (!canvasEl) return;

    const link = document.createElement('a');
    link.href = (canvasEl as HTMLCanvasElement).toDataURL('image/jpeg', 1.0);
    link.download = `qr-lote-${lot.code}.jpg`;
    link.click();
  };

  return (
    <Modal isOpen={!!lot} onClose={onClose} title={`QR — ${lot.name}`} maxWidthClassName="max-w-sm">
      <div className="p-6 flex flex-col items-center gap-4">
        <div ref={svgContainerRef}>
          <QRCodeSVG value={qrValueForLot(lot.id)} size={200} />
        </div>
        {/* Canvas oculto, solo para poder exportar a JPG (toDataURL requiere canvas real). */}
        <div ref={canvasContainerRef} className="hidden">
          <QRCodeCanvas value={qrValueForLot(lot.id)} size={512} />
        </div>

        <p className="text-sm text-slate-500 text-center">
          Código {lot.code} — este QR no cambia, imprímelo y pégalo junto al lote.
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={downloadSvg}>Descargar SVG</Button>
          <Button variant="secondary" onClick={downloadJpg}>Descargar JPG</Button>
        </div>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
};
