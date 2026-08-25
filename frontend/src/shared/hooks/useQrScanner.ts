import { useEffect, useRef } from 'react';
import { Html5Qrcode, type Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface UseQrScannerOptions {
  containerId: string;
  isActive: boolean;
  onDecode: (text: string) => void;
  onError?: (err: unknown) => void;
  formats?: Html5QrcodeSupportedFormats[];
}

/**
 * Lógica de cámara compartida entre WebScanner (Inventory), CameraQrModal
 * (Tracking) y UniversalScannerModal — antes cada uno reimplementaba casi
 * línea por línea el montaje/desmontaje de Html5Qrcode. Pausa tras el primer
 * código leído; el llamador decide si lo acepta o llama a `resume()` para
 * seguir escaneando (ej. cuando el código no tiene el formato esperado).
 */
export function useQrScanner({ containerId, isActive, onDecode, onError, formats }: UseQrScannerOptions) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isActive) return;
    if (scannerRef.current) return;

    let isScanProcessed = false;
    let cancelled = false;
    let rafId: number;

    // El contenedor puede vivir dentro de un Modal con montaje diferido
    // (show/animate un tick detrás de isOpen) — se reintenta por frame hasta
    // que el <div id={containerId}> exista realmente en el DOM.
    const tryStart = () => {
      if (cancelled) return;
      const container = document.getElementById(containerId);
      if (!container) {
        rafId = requestAnimationFrame(tryStart);
        return;
      }
      container.innerHTML = '';

      const html5QrCode = new Html5Qrcode(
        containerId,
        formats ? { formatsToSupport: formats, verbose: false } : undefined,
      );
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        decodedText => {
          if (isScanProcessed) return;
          isScanProcessed = true;
          if (html5QrCode.isScanning) html5QrCode.pause();
          onDecode(decodedText);
          isScanProcessed = false;
        },
        errorMessage => {
          onError?.(errorMessage);
        },
      ).catch(err => {
        console.error('Camera start error:', err);
        onError?.(err);
      });
    };

    rafId = requestAnimationFrame(tryStart);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
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
  }, [isActive, containerId]);

  const resume = () => {
    if (scannerRef.current && !scannerRef.current.isScanning) {
      scannerRef.current.resume();
    }
  };

  return { resume };
}
