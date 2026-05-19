export interface CapabilityResult {
  cp: number | null;
  cpk: number | null;
  cpl: number | null;
  cpu: number | null;
  k: number | null;
  ppm: number | null;
  sigmaLevel: number | null;
  ppmLower?: number | null;
  ppmUpper?: number | null;
  pncPercent?: number | null;
}

/**
 * Calcula el índice Cp (Capacidad Potencial)
 * Según documento página 44: Cp = (LSE - LIE) / (6 * σ)
 * Interpretación:
 * - Cp < 1.0: No capaz
 * - 1.0 ≤ Cp < 1.33: Marginalmente capaz
 * - 1.33 ≤ Cp < 1.67: Capaz
 * - Cp ≥ 1.67: Muy capaz
 */
export function calculateCp(lie: number, lse: number, sigma: number): number | null {
  if (lie >= lse || sigma <= 0) return null;
  return (lse - lie) / (6 * sigma);
}

/**
 * Calcula el índice Cpk (Capacidad Real)
 * Según documento página 45: Cpk = min(Cpu, Cpl)
 * Cpu = (LSE - media) / (3 * sigma)
 * Cpl = (media - LIE) / (3 * sigma)
 */
export function calculateCpk(
  lie: number,
  lse: number,
  mean: number,
  sigma: number
): { cpk: number | null; cpl: number | null; cpu: number | null } {
  if (lie >= lse || sigma <= 0) {
    return { cpk: null, cpl: null, cpu: null };
  }
  
  const cpl = (mean - lie) / (3 * sigma);
  const cpu = (lse - mean) / (3 * sigma);
  const cpk = Math.min(cpl, cpu);
  
  return { cpk, cpl, cpu };
}

/**
 * Calcula el índice K (Descentramiento)
 * Según documento página 46: K = |media - M| / ((LSE - LIE)/2) * 100%
 * Donde M = (LIE + LSE) / 2
 * Interpretación:
 * - K = 0%: Perfectamente centrado
 * - K < 25%: Centrado aceptable
 * - 25% ≤ K < 50%: Descentramiento moderado
 * - K ≥ 50%: Descentramiento severo
 */
export function calculateK(lie: number, lse: number, mean: number): number | null {
  if (lie >= lse) return null;
  const target = (lie + lse) / 2;
  const halfRange = (lse - lie) / 2;
  if (halfRange === 0) return null;
  return (Math.abs(mean - target) / halfRange) * 100;
}

/**
 * Función de distribución acumulada normal estándar
 * Para calcular probabilidades
 */
function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  if (z > 0) {
    return 1 - p;
  }
  return p;
}

/**
 * Calcula el PPM (Partes Por Millón) y %PNC
 * Según documento página 48: %PNC = (PPM_total / 1,000,000) * 100
 */
export function calculatePPM(
  lie: number,
  lse: number,
  mean: number,
  sigma: number
): { ppm: number | null; ppmLower: number | null; ppmUpper: number | null; pncPercent: number | null } {
  if (lie >= lse || sigma <= 0) {
    return { ppm: null, ppmLower: null, ppmUpper: null, pncPercent: null };
  }
  
  // Calcular probabilidad de estar fuera del límite inferior
  const zLower = (lie - mean) / sigma;
  const pLower = normCdf(zLower);
  
  // Calcular probabilidad de estar fuera del límite superior
  const zUpper = (lse - mean) / sigma;
  const pUpper = 1 - normCdf(zUpper);
  
  const ppmLower = pLower * 1_000_000;
  const ppmUpper = pUpper * 1_000_000;
  const ppmTotal = ppmLower + ppmUpper;
  const pncPercent = (ppmTotal / 1_000_000) * 100;
  
  return {
    ppm: Math.max(0, ppmTotal),
    ppmLower: Math.max(0, ppmLower),
    ppmUpper: Math.max(0, ppmUpper),
    pncPercent: Math.max(0, pncPercent)
  };
}

/**
 * Calcula el Nivel Sigma (Z bench)
 * Según documento página 47-48: Z = min(Z_sup, Z_inf)
 * Z_sup = (LSE - media) / sigma
 * Z_inf = (media - LIE) / sigma
 */
export function calculateSigmaLevel(
  lie: number,
  lse: number,
  mean: number,
  sigma: number
): number | null {
  if (lie >= lse || sigma <= 0) return null;
  
  const zSup = (lse - mean) / sigma;
  const zInf = (mean - lie) / sigma;
  const zBench = Math.min(zSup, zInf);
  
  return zBench;
}

/**
 * Obtiene la clasificación del proceso basada en Cpk
 * Según documento página 45-46
 * Nota: A+ (excelente) se muestra como A en el badge pero con texto especial
 */
export function getCapabilityClassification(cpk: number | null): {
  grade: 'A' | 'B' | 'C' | 'D';
  text: string;
  color: string;
} {
  if (!cpk) return { grade: 'D', text: 'No calculado', color: '#6b7280' };
  
  // Para Cpk >= 1.67 mostramos A (con texto especial A+)
  if (cpk >= 1.67) {
    return { grade: 'A', text: 'Excelente - Muy capaz (A+)', color: '#10b981' };
  }
  if (cpk >= 1.33) {
    return { grade: 'A', text: 'Muy capaz - Proceso excelente', color: '#10b981' };
  }
  if (cpk >= 1.0) {
    return { grade: 'B', text: 'Capaz - Proceso aceptable', color: '#3b82f6' };
  }
  if (cpk >= 0.67) {
    return { grade: 'C', text: 'Marginalmente capaz - Requiere mejora', color: '#f59e0b' };
  }
  return { grade: 'D', text: 'No capaz - Requiere acción inmediata', color: '#ef4444' };
}

/**
 * Calcula todos los índices de capacidad
 * Según documento Sección 5 completo
 */
export function calculateAllCapabilityIndices(
  lie: number | null,
  lse: number | null,
  mean: number,
  sigma: number
): CapabilityResult {
  if (lie === null || lse === null || lie >= lse) {
    return {
      cp: null,
      cpk: null,
      cpl: null,
      cpu: null,
      k: null,
      ppm: null,
      sigmaLevel: null,
      ppmLower: null,
      ppmUpper: null,
      pncPercent: null
    };
  }
  
  const cp = calculateCp(lie, lse, sigma);
  const { cpk, cpl, cpu } = calculateCpk(lie, lse, mean, sigma);
  const k = calculateK(lie, lse, mean);
  const { ppm, ppmLower, ppmUpper, pncPercent } = calculatePPM(lie, lse, mean, sigma);
  const sigmaLevel = calculateSigmaLevel(lie, lse, mean, sigma);
  
  return {
    cp,
    cpk,
    cpl,
    cpu,
    k,
    ppm,
    sigmaLevel,
    ppmLower,
    ppmUpper,
    pncPercent
  };
}