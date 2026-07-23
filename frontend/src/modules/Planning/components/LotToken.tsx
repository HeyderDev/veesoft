import React, { useRef, useState } from 'react';
import type { Lote } from '../types';
import { LotDiagram } from './LotDiagram';

// Mismos tonos que los usados en el resto de la UI para cada estado, pero aplicados
// directamente al contorno del plano (no a una caja que lo envuelve).
const statusOutlineColor: Record<Lote['current_status'], string> = {
  available: '#34d399',
  occupied: '#fbbf24',
  inactive: '#cbd5e1',
};

interface LotTokenProps {
  lote: Lote;
  pixelsPerMeter: number;
  zoom: number;
  xMeters: number;
  yMeters: number;
  onClick: () => void;
  onDragEnd: (xMeters: number, yMeters: number) => void;
}

const CLICK_THRESHOLD_PX = 5;

export const LotToken: React.FC<LotTokenProps> = ({
  lote, pixelsPerMeter, zoom, xMeters, yMeters, onClick, onDragEnd,
}) => {
  const [dragOffsetPx, setDragOffsetPx] = useState<{ dx: number; dy: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = { startX: e.clientX, startY: e.clientY, moved: false };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState.current) return;
      const dx = moveEvent.clientX - dragState.current.startX;
      const dy = moveEvent.clientY - dragState.current.startY;
      if (Math.abs(dx) > CLICK_THRESHOLD_PX || Math.abs(dy) > CLICK_THRESHOLD_PX) {
        dragState.current.moved = true;
      }
      setDragOffsetPx({ dx, dy });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (dragState.current?.moved) {
        const dx = upEvent.clientX - dragState.current.startX;
        const dy = upEvent.clientY - dragState.current.startY;
        const scale = pixelsPerMeter * zoom;
        onDragEnd(Math.max(0, xMeters + dx / scale), Math.max(0, yMeters + dy / scale));
      } else {
        onClick();
      }
      setDragOffsetPx(null);
      dragState.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const widthPx = Number(lote.width) * pixelsPerMeter;
  const heightPx = Number(lote.length) * pixelsPerMeter;
  const left = xMeters * pixelsPerMeter + (dragOffsetPx ? dragOffsetPx.dx / zoom : 0);
  const top = yMeters * pixelsPerMeter + (dragOffsetPx ? dragOffsetPx.dy / zoom : 0);

  const outlineColor = statusOutlineColor[lote.current_status];

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute select-none cursor-grab active:cursor-grabbing ${dragOffsetPx ? 'z-30' : 'z-10'}`}
      style={{ left, top, width: widthPx, height: heightPx }}
    >
      <span
        className="absolute -top-5 left-0 bg-white border rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm whitespace-nowrap max-w-[160px] truncate"
        style={{ borderColor: outlineColor }}
      >
        {lote.name}
      </span>
      {/* Sin caja envolvente: el plano generado (LotDiagram) es la única superficie
          interactiva y ocupa exactamente el ancho/largo del lote en la cuadrícula. */}
      <LotDiagram
        width={Number(lote.width)}
        length={Number(lote.length)}
        fundaDiameter={Number(lote.funda_diameter)}
        corridorCount={lote.corridor_count}
        corridorWidth={Number(lote.corridor_width)}
        showMeasurements={false}
        outlineColor={outlineColor}
        className="w-full h-full pointer-events-none"
        style={dragOffsetPx ? { filter: 'drop-shadow(0 6px 10px rgba(15, 23, 42, 0.35))' } : undefined}
      />
    </div>
  );
};
