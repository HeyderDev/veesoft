import React from 'react';
import { calculateLotCapacity } from '../utils/lotCapacity';

interface LotDiagramProps {
  width: number; // metros
  length: number; // metros
  fundaDiameter: number; // cm
  corridorCount: number;
  corridorWidth: number; // cm
  className?: string;
  style?: React.CSSProperties;
  showMeasurements?: boolean;
  outlineColor?: string;
}

/**
 * Diagrama tipo "plano de construcción" del lote: rectángulo a escala real (metros como
 * unidades del SVG), corredores paralelos al largo repartidos en franjas uniformes, y
 * las plántulas que caben representadas como círculos. Se usa tanto en la vista previa
 * en vivo del formulario de creación como en la tarjeta de cada lote ya creado.
 */
export const LotDiagram: React.FC<LotDiagramProps> = ({
  width, length, fundaDiameter, corridorCount, corridorWidth, className = '', style, showMeasurements = true,
  outlineColor = '#334155',
}) => {
  if (!width || !length) {
    return (
      <div className={`flex items-center justify-center text-slate-300 text-sm ${className}`}>
        Ingresa ancho y largo para ver el plano
      </div>
    );
  }

  const result = calculateLotCapacity({ width, length, fundaDiameter, corridorCount, corridorWidth });
  const corridorWidthM = corridorWidth / 100;
  const diameterM = fundaDiameter / 100;
  const stripCount = corridorCount + 1;
  const stripWidth = result.isValid ? result.plantableWidth / stripCount : 0;

  // Margen alrededor del rectángulo para las cotas (medidas). Sin cotas, no hay margen:
  // el rectángulo del lote ocupa el 100% del viewBox, para que a escala (metros = píxeles
  // de la cuadrícula) cubra exactamente sus celdas, sin ningún relleno interno.
  const margin = showMeasurements ? Math.max(width, length) * 0.16 : 0;
  const viewBox = showMeasurements
    ? `${-margin} ${-margin * 0.7} ${width + margin * 2} ${length + margin * 1.6}`
    : `0 0 ${width} ${length}`;

  // Límite de seguridad: no renderizar miles de círculos individuales.
  const MAX_PLANTS_RENDERED = 3000;
  const drawPlants = result.isValid && result.capacity > 0 && result.capacity <= MAX_PLANTS_RENDERED;

  const strips = result.isValid
    ? Array.from({ length: stripCount }, (_, i) => i * (stripWidth + corridorWidthM))
    : [];

  return (
    <svg viewBox={viewBox} className={className} style={style} role="img" aria-label="Plano del lote">
      {/* Contorno del lote */}
      <rect x={0} y={0} width={width} height={length} fill="#f8fafc" stroke={outlineColor} strokeWidth={width * 0.006} />

      {/* Franjas de siembra y corredores */}
      {result.isValid && strips.map((x, i) => (
        <g key={i}>
          <rect x={x} y={0} width={stripWidth} height={length} fill="#ecfdf5" stroke="#a7f3d0" strokeWidth={width * 0.003} />
          {drawPlants && Array.from({ length: Math.floor(length / diameterM) }, (_, row) => (
            Array.from({ length: Math.floor(stripWidth / diameterM) }, (_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={x + diameterM / 2 + col * diameterM}
                cy={diameterM / 2 + row * diameterM}
                r={diameterM * 0.4}
                fill="#10b981"
              />
            ))
          ))}
          {i < corridorCount && (
            <rect
              x={x + stripWidth}
              y={0}
              width={corridorWidthM}
              height={length}
              fill="#e2e8f0"
              stroke="#cbd5e1"
              strokeWidth={width * 0.003}
            />
          )}
        </g>
      ))}

      {showMeasurements && (
        <>
          {/* Cota de ancho (abajo) */}
          <text x={width / 2} y={length + margin * 0.9} fontSize={margin * 0.42} textAnchor="middle" fill="#475569">
            {width} m
          </text>
          {/* Cota de largo (izquierda, rotada) */}
          <text
            x={-margin * 0.5}
            y={length / 2}
            fontSize={margin * 0.42}
            textAnchor="middle"
            fill="#475569"
            transform={`rotate(-90, ${-margin * 0.5}, ${length / 2})`}
          >
            {length} m
          </text>
        </>
      )}
    </svg>
  );
};
