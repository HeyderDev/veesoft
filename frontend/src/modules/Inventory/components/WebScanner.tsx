import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface WebScannerProps {
  onScan: (code: string) => void;
  onError?: (err: any) => void;
}

export const WebScanner = ({ onScan, onError }: WebScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
      },
      (error) => {
        if (onError) onError(error);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan, onError]);

  return <div id="reader" className="w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-green-200"></div>;
};
