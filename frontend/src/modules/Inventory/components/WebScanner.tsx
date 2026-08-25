import { Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useQrScanner } from '../../../shared/hooks/useQrScanner';

// QR + los formatos de código de barras más comunes en etiquetas de inventario
// (el escáner solo leía QR por defecto — las etiquetas impresas en CODE128
// desde SuppliesPage/ToolsPage no eran reconocidas).
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
];

interface WebScannerProps {
  onScan: (code: string) => void;
  onError?: (err: any) => void;
}

const CONTAINER_ID = 'qr-reader';

export const WebScanner = ({ onScan, onError }: WebScannerProps) => {
  useQrScanner({
    containerId: CONTAINER_ID,
    isActive: true,
    onDecode: onScan,
    onError,
    formats: SUPPORTED_FORMATS,
  });

  return (
    <div className="w-full max-w-md mx-auto relative rounded-lg overflow-hidden border-2 border-emerald-500 bg-black">
      <div id={CONTAINER_ID} className="w-full"></div>
      {/* Custom UI overlay (optional, since raw API doesn't provide it) */}
      <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
        <div className="w-full h-full border-2 border-emerald-500 rounded-xl relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -ml-[2px] -mt-[2px]"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mr-[2px] -mt-[2px]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -ml-[2px] -mb-[2px]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mr-[2px] -mb-[2px]"></div>
        </div>
      </div>
    </div>
  );
};
