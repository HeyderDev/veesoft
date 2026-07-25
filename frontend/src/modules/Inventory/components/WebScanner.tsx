import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface WebScannerProps {
  onScan: (code: string) => void;
  onError?: (err: any) => void;
}

export const WebScanner = ({ onScan, onError }: WebScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader"; // ID doesn't need to be random if we clean up correctly

  useEffect(() => {
    // Prevent double initialization in Strict Mode
    if (scannerRef.current) return;

    let isScanProcessed = false;
    
    // Hard-clear any lingering DOM from React StrictMode unmounts
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';

    const html5QrCode = new Html5Qrcode(containerId);
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        if (isScanProcessed) return;
        isScanProcessed = true; // Prevent multiple scans
        
        // Pause scanning to avoid further callbacks
        if (html5QrCode.isScanning) {
          html5QrCode.pause();
        }
        
        onScan(decodedText);
      },
      (errorMessage) => {
        if (onError) onError(errorMessage);
      }
    ).catch((err) => {
      console.error("Camera start error:", err);
      if (onError) onError(err);
    });

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(console.error);
        } else {
          scannerRef.current.clear();
        }
        scannerRef.current = null;
      }
    };
  }, [onScan, onError]);

  return (
    <div className="w-full max-w-md mx-auto relative rounded-lg overflow-hidden border-2 border-emerald-500 bg-black">
      <div id={containerId} className="w-full"></div>
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
