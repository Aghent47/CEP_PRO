import type { AttributeChartData, AttributeValidationResult } from '../types/attributeTypes';

/**
 * Valida los datos para gráficos de atributos
 */
export function validateAttributeData(
  sampleSizes: number[],
  defects: number[]
): AttributeValidationResult {
  const warnings: string[] = [];
  
  // Validar que hay al menos 2 subgrupos
  if (sampleSizes.length < 2) {
    return { isValid: false, error: 'Se necesitan al menos 2 subgrupos para el análisis' };
  }
  
  // Validar que todos los tamaños de muestra son positivos
  for (let i = 0; i < sampleSizes.length; i++) {
    if (sampleSizes[i] < 1) {
      return { isValid: false, error: `El subgrupo ${i + 1} tiene tamaño de muestra inválido (${sampleSizes[i]}). Debe ser ≥ 1` };
    }
  }
  
  // Validar que defectos no sea mayor que tamaño de muestra
  for (let i = 0; i < defects.length; i++) {
    if (defects[i] > sampleSizes[i]) {
      return { isValid: false, error: `Subgrupo ${i + 1}: defectos (${defects[i]}) no puede ser mayor que inspeccionados (${sampleSizes[i]})` };
    }
    if (defects[i] < 0) {
      return { isValid: false, error: `Subgrupo ${i + 1}: defectos (${defects[i]}) no puede ser negativo` };
    }
  }
  
  // Advertencia sobre muestra pequeña
  const avgSampleSize = sampleSizes.reduce((a, b) => a + b, 0) / sampleSizes.length;
  if (avgSampleSize < 50) {
    warnings.push(`⚠️ Tamaño de muestra promedio bajo (${avgSampleSize.toFixed(1)}). Los límites pueden ser menos confiables.`);
  }
  
  return { isValid: true, warnings };
}

/**
 * Gráfico p (Proporción de unidades defectuosas)
 * Para tamaño de muestra variable o constante
 */
export function calculatePChart(
  sampleSizes: number[],
  defects: number[]
): AttributeChartData {
  const validation = validateAttributeData(sampleSizes, defects);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  const totalDefects = defects.reduce((a, b) => a + b, 0);
  const totalSample = sampleSizes.reduce((a, b) => a + b, 0);
  const pBar = totalDefects / totalSample; // Proporción promedio global
  
  const values = defects.map((d, i) => d / sampleSizes[i]);
  const ucl: number[] = [];
  const lcl: number[] = [];
  
  for (let i = 0; i < sampleSizes.length; i++) {
    const sigma = Math.sqrt(pBar * (1 - pBar) / sampleSizes[i]);
    const upper = pBar + 3 * sigma;
    const lower = pBar - 3 * sigma;
    ucl.push(upper);
    lcl.push(Math.max(0, lower)); // No puede ser negativo
  }
  
  return {
    type: 'p',
    values,
    centerLine: pBar,
    ucl,
    lcl,
    sampleSizes,
    subgroups: sampleSizes.map((_, i) => i + 1),
    warnings: validation.warnings || []
  };
}

/**
 * Gráfico np (Número de unidades defectuosas)
 * Requiere tamaño de muestra constante
 */
export function calculateNPChart(
  sampleSizes: number[],
  defects: number[]
): AttributeChartData {
  const validation = validateAttributeData(sampleSizes, defects);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // Verificar que el tamaño de muestra es constante
  const uniqueSizes = [...new Set(sampleSizes)];
  if (uniqueSizes.length > 1) {
    throw new Error('El gráfico np requiere tamaño de muestra constante. Use gráfico p para tamaños variables.');
  }
  
  const n = uniqueSizes[0];
  const totalDefects = defects.reduce((a, b) => a + b, 0);
  const npBar = totalDefects / defects.length; // Promedio de defectuosos
  const pBar = npBar / n;
  
  const values = [...defects];
  const sigma = Math.sqrt(npBar * (1 - pBar));
  const uclConst = npBar + 3 * sigma;
  const lclConst = Math.max(0, npBar - 3 * sigma);
  
  return {
    type: 'np',
    values,
    centerLine: npBar,
    ucl: Array(sampleSizes.length).fill(uclConst),
    lcl: Array(sampleSizes.length).fill(lclConst),
    sampleSizes,
    subgroups: sampleSizes.map((_, i) => i + 1),
    warnings: validation.warnings || []
  };
}

/**
 * Gráfico c (Número de defectos por unidad)
 * Tamaño de unidad constante
 */
export function calculateCChart(
  defects: number[]
): AttributeChartData {
  if (defects.length < 2) {
    throw new Error('Se necesitan al menos 2 subgrupos para el análisis');
  }
  
  for (let i = 0; i < defects.length; i++) {
    if (defects[i] < 0) {
      throw new Error(`Subgrupo ${i + 1}: defectos (${defects[i]}) no puede ser negativo`);
    }
  }
  
  const cBar = defects.reduce((a, b) => a + b, 0) / defects.length;
  const sigma = Math.sqrt(cBar);
  const uclConst = cBar + 3 * sigma;
  const lclConst = Math.max(0, cBar - 3 * sigma);
  
  return {
    type: 'c',
    values: [...defects],
    centerLine: cBar,
    ucl: Array(defects.length).fill(uclConst),
    lcl: Array(defects.length).fill(lclConst),
    sampleSizes: Array(defects.length).fill(1),
    subgroups: defects.map((_, i) => i + 1),
    warnings: []
  };
}

/**
 * Gráfico u (Defectos por unidad)
 * Tamaño de unidad variable
 */
export function calculateUChart(
  unitSizes: number[],  // Tamaño de cada unidad de inspección
  defects: number[]
): AttributeChartData {
  if (unitSizes.length < 2) {
    throw new Error('Se necesitan al menos 2 subgrupos para el análisis');
  }
  
  for (let i = 0; i < unitSizes.length; i++) {
    if (unitSizes[i] <= 0) {
      throw new Error(`Subgrupo ${i + 1}: tamaño de unidad inválido (${unitSizes[i]})`);
    }
    if (defects[i] < 0) {
      throw new Error(`Subgrupo ${i + 1}: defectos (${defects[i]}) no puede ser negativo`);
    }
  }
  
  const totalDefects = defects.reduce((a, b) => a + b, 0);
  const totalUnits = unitSizes.reduce((a, b) => a + b, 0);
  const uBar = totalDefects / totalUnits; // Densidad promedio de defectos
  
  const values = defects.map((d, i) => d / unitSizes[i]);
  const ucl: number[] = [];
  const lcl: number[] = [];
  
  for (let i = 0; i < unitSizes.length; i++) {
    const sigma = Math.sqrt(uBar / unitSizes[i]);
    const upper = uBar + 3 * sigma;
    const lower = uBar - 3 * sigma;
    ucl.push(upper);
    lcl.push(Math.max(0, lower));
  }
  
  return {
    type: 'u',
    values,
    centerLine: uBar,
    ucl,
    lcl,
    sampleSizes: unitSizes,
    subgroups: unitSizes.map((_, i) => i + 1),
    warnings: []
  };
}

/**
 * Detectar qué tipo de gráfico usar según los datos
 */
export function detectAttributeChartType(
  sampleSizes: number[],
  hasUnitSizes: boolean
): 'p' | 'np' | 'c' | 'u' {
  const uniqueSizes = [...new Set(sampleSizes)];
  const isConstant = uniqueSizes.length === 1;
  
  if (hasUnitSizes) {
    return 'u';
  }
  
  if (isConstant) {
    return 'np';
  }
  
  return 'p';
}