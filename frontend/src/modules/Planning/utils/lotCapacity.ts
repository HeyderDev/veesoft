/**
 * Espejo exacto de LotService::calculateCapacity() en el backend
 * (backend/app/Modules/Planning/Services/LotService.php).
 * Cualquier cambio en la fórmula debe replicarse en ambos lugares.
 */
export interface LotGeometry {
  width: number; // metros
  length: number; // metros
  fundaDiameter: number; // centímetros
  corridorCount: number;
  corridorWidth: number; // centímetros
}

export interface LotCapacityResult {
  capacity: number;
  plantableWidth: number; // metros
  isValid: boolean;
  error?: string;
}

export function calculateLotCapacity(geometry: LotGeometry): LotCapacityResult {
  const { width, length, fundaDiameter, corridorCount, corridorWidth } = geometry;

  const corridorWidthM = corridorWidth / 100;
  const plantableWidth = width - corridorCount * corridorWidthM;

  if (!width || !length || !fundaDiameter || plantableWidth <= 0) {
    return {
      capacity: 0,
      plantableWidth: Math.max(0, plantableWidth),
      isValid: false,
      error: plantableWidth <= 0 ? 'Los corredores ocupan más ancho del que tiene el lote disponible.' : undefined,
    };
  }

  const diameterM = fundaDiameter / 100;
  const plantsAcrossWidth = Math.floor(plantableWidth / diameterM);
  const rowsAlongLength = Math.floor(length / diameterM);

  return {
    capacity: Math.max(0, plantsAcrossWidth * rowsAlongLength),
    plantableWidth,
    isValid: true,
  };
}

export const CAPACITY_TOLERANCE = 0.15;

export function capacityToleranceRange(calculatedCapacity: number): { min: number; max: number } {
  const tolerance = Math.round(calculatedCapacity * CAPACITY_TOLERANCE);
  return { min: calculatedCapacity - tolerance, max: calculatedCapacity + tolerance };
}
