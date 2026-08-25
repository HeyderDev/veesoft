import React, { useRef, useState } from 'react';
import type { Lote } from '../types';
import { LotToken } from './LotToken';

const PIXELS_PER_METER = 24;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;
const PAN_STEP = 80;
const GRID_MARGIN_METERS = 20;
const GRID_MIN_SIZE_METERS = 60;
const MAJOR_GRID_EVERY_METERS = 5;

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

interface LotWorkspaceProps {
  lots: Lote[];
  onOpenDetail: (lote: Lote) => void;
  onDragEnd: (loteId: number, xMeters: number, yMeters: number) => void;
}

/**
 * Campo de trabajo tipo "workspace" (como un editor de diseño): se puede desplazar
 * (arrastrando el fondo cuadriculado) y hacer zoom (rueda del mouse o botones), y cada
 * lote se dibuja a escala real (metros) respecto a los demás — el fondo cuadriculado
 * representa 1m² por celda.
 */
export const LotWorkspace: React.FC<LotWorkspaceProps> = ({ lots, onOpenDetail, onDragEnd }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 40, y: 40 });
  const containerRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const touchState = useRef<{
    mode: 'pan' | 'pinch';
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    startDistance: number;
    startZoom: number;
  } | null>(null);

  const fallbackPosition = (index: number) => ({
    x: 4 + (index % 4) * 12,
    y: 4 + Math.floor(index / 4) * 12,
  });

  // Extensión del terreno (en metros) que cubre la cuadrícula de fondo: se ajusta al
  // área realmente ocupada por los lotes (con margen), como el plano de un campo real.
  const { gridWidthM, gridHeightM } = (() => {
    let maxX = GRID_MIN_SIZE_METERS;
    let maxY = GRID_MIN_SIZE_METERS;
    lots.forEach((lote, index) => {
      const fallback = fallbackPosition(index);
      const x = lote.position_x !== null ? Number(lote.position_x) : fallback.x;
      const y = lote.position_y !== null ? Number(lote.position_y) : fallback.y;
      maxX = Math.max(maxX, x + Number(lote.width));
      maxY = Math.max(maxY, y + Number(lote.length));
    });
    return { gridWidthM: maxX + GRID_MARGIN_METERS, gridHeightM: maxY + GRID_MARGIN_METERS };
  })();

  const zoomAt = (cursorX: number, cursorY: number, factor: number) => {
    setZoom(prevZoom => {
      const newZoom = clampZoom(prevZoom * factor);
      setOffset(prevOffset => ({
        x: cursorX - (cursorX - prevOffset.x) * (newZoom / prevZoom),
        y: cursorY - (cursorY - prevOffset.y) * (newZoom / prevZoom),
      }));
      return newZoom;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    zoomAt(cursorX, cursorY, e.deltaY > 0 ? 1 - ZOOM_STEP : 1 + ZOOM_STEP);
  };

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return; // solo si el click empieza en el fondo, no en un lote
    panState.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!panState.current) return;
      setOffset({
        x: panState.current.originX + (moveEvent.clientX - panState.current.startX),
        y: panState.current.originY + (moveEvent.clientY - panState.current.startY),
      });
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      panState.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const touchDistance = (t1: React.Touch | Touch, t2: React.Touch | Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const touchMidpoint = (t1: React.Touch | Touch, t2: React.Touch | Touch, rect: DOMRect) => ({
    x: (t1.clientX + t2.clientX) / 2 - rect.left,
    y: (t1.clientY + t2.clientY) / 2 - rect.top,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target !== e.currentTarget && e.touches.length === 1) return; // 1 dedo sobre un lote: lo maneja LotToken
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 2) {
      const mid = touchMidpoint(e.touches[0], e.touches[1], rect);
      touchState.current = {
        mode: 'pinch',
        startX: mid.x,
        startY: mid.y,
        originX: offset.x,
        originY: offset.y,
        startDistance: touchDistance(e.touches[0], e.touches[1]),
        startZoom: zoom,
      };
    } else if (e.touches.length === 1) {
      touchState.current = {
        mode: 'pan',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originX: offset.x,
        originY: offset.y,
        startDistance: 0,
        startZoom: zoom,
      };
    }

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!touchState.current) return;
      const state = touchState.current;

      if (state.mode === 'pinch' && moveEvent.touches.length === 2) {
        moveEvent.preventDefault();
        const currentDistance = touchDistance(moveEvent.touches[0], moveEvent.touches[1]);
        const newZoom = clampZoom(state.startZoom * (currentDistance / state.startDistance));
        setZoom(newZoom);
        setOffset({
          x: state.startX - (state.startX - state.originX) * (newZoom / state.startZoom),
          y: state.startY - (state.startY - state.originY) * (newZoom / state.startZoom),
        });
      } else if (state.mode === 'pan' && moveEvent.touches.length === 1) {
        moveEvent.preventDefault();
        setOffset({
          x: state.originX + (moveEvent.touches[0].clientX - state.startX),
          y: state.originY + (moveEvent.touches[0].clientY - state.startY),
        });
      }
    };
    const handleTouchEnd = (endEvent: TouchEvent) => {
      if (endEvent.touches.length === 0) {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        touchState.current = null;
      }
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const zoomButton = (factor: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 0;
    const cy = rect ? rect.height / 2 : 0;
    zoomAt(cx, cy, factor);
  };

  const pan = (dx: number, dy: number) => setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));

  const resetView = () => { setZoom(1); setOffset({ x: 40, y: 40 }); };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleBackgroundMouseDown}
      onTouchStart={handleTouchStart}
      className="relative w-full h-[640px] rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
    >
      <div
        className="absolute top-0 left-0"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
      >
        {/* Cuadrícula de fondo: 1 celda = 1m², con línea marcada cada 5m, como un plano */}
        <div
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: gridWidthM * PIXELS_PER_METER,
            height: gridHeightM * PIXELS_PER_METER,
            backgroundImage: [
              'linear-gradient(to right, #e2e8f0 1px, transparent 1px)',
              'linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
              'linear-gradient(to right, #cbd5e1 1px, transparent 1px)',
              'linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: [
              `${PIXELS_PER_METER}px ${PIXELS_PER_METER}px`,
              `${PIXELS_PER_METER}px ${PIXELS_PER_METER}px`,
              `${PIXELS_PER_METER * MAJOR_GRID_EVERY_METERS}px ${PIXELS_PER_METER * MAJOR_GRID_EVERY_METERS}px`,
              `${PIXELS_PER_METER * MAJOR_GRID_EVERY_METERS}px ${PIXELS_PER_METER * MAJOR_GRID_EVERY_METERS}px`,
            ].join(', '),
          }}
        />

        {lots.map((lote, index) => {
          const fallback = fallbackPosition(index);
          const xMeters = lote.position_x !== null ? Number(lote.position_x) : fallback.x;
          const yMeters = lote.position_y !== null ? Number(lote.position_y) : fallback.y;

          return (
            <LotToken
              key={lote.id}
              lote={lote}
              pixelsPerMeter={PIXELS_PER_METER}
              zoom={zoom}
              xMeters={xMeters}
              yMeters={yMeters}
              onClick={() => onOpenDetail(lote)}
              onDragEnd={(x, y) => onDragEnd(lote.id, x, y)}
            />
          );
        })}
      </div>

      {/* Controles de zoom / desplazamiento */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
        <div className="grid grid-cols-3 gap-1 bg-white rounded-lg border border-slate-200 shadow-sm p-1">
          <div />
          <button type="button" onClick={() => pan(0, PAN_STEP)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500">▲</button>
          <div />
          <button type="button" onClick={() => pan(PAN_STEP, 0)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500">◀</button>
          <button type="button" onClick={resetView} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500" title="Centrar vista">⌂</button>
          <button type="button" onClick={() => pan(-PAN_STEP, 0)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500">▶</button>
          <div />
          <button type="button" onClick={() => pan(0, -PAN_STEP)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500">▼</button>
          <div />
        </div>
        <div className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <button type="button" onClick={() => zoomButton(1 + ZOOM_STEP)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold border-b border-slate-100">+</button>
          <button type="button" onClick={() => zoomButton(1 - ZOOM_STEP)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold">−</button>
        </div>
      </div>
    </div>
  );
};
