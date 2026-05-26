/**
 * Pruebas de Normalidad según documento (páginas 30-37)
 * - Gráfico Q-Q (visual)
 * - Prueba de Shapiro-Wilk (analítica)
 * - Coeficientes de asimetría y curtosis
 */

export interface NormalityResult {
  isNormal: boolean;
  shapiroWilk: {
    statistic: number;
    pValue: number;
    interpretation: string;
  };
  skewness: {
    value: number;
    interpretation: string;
  };
  kurtosis: {
    value: number;
    interpretation: string;
  };
  recommendations: string[];
  qqData: { theoretical: number[]; sample: number[] };
}

/**
 * Calcula la asimetría (skewness) de los datos
 * Skewness ≈ 0 → Simétrico (normal)
 * Skewness > 0 → Sesgo positivo (cola derecha larga)
 * Skewness < 0 → Sesgo negativo (cola izquierda larga)
 */
export function calculateSkewness(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const skewness = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / n;
  return skewness;
}

/**
 * Calcula la curtosis (kurtosis) de los datos
 * Kurtosis ≈ 3 → Mesocúrtica (normal)
 * Kurtosis > 3 → Leptocúrtica (picos más altos, colas más pesadas)
 * Kurtosis < 3 → Platicúrtica (picos más bajos, colas más ligeras)
 */
export function calculateKurtosis(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const kurtosis = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / n;
  return kurtosis;
}

/**
 * Prueba de Shapiro-Wilk (simplificada)
 * Nota: Esta es una aproximación. Para producción, usar librería especializada
 */
export function calculateShapiroWilk(data: number[]): { statistic: number; pValue: number } {
  const n = data.length;
  const sortedData = [...data].sort((a, b) => a - b);
  const mean = data.reduce((a, b) => a + b, 0) / n;
  
  // Calcular suma de cuadrados total
  const totalSS = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  
  // Coeficientes a_i aproximados (versión simplificada)
  const aCoeffs = generateACoefficients(n);
  
  // Calcular estadístico W
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += aCoeffs[i] * sortedData[i];
  }
  numerator = Math.pow(numerator, 2);
  
  const W = numerator / totalSS;
  
  // Aproximación del p-valor
  const pValue = approximatePValue(W);
  
  return { statistic: W, pValue };
}

/**
 * Generar coeficientes a_i para Shapiro-Wilk (simplificado)
 */
function generateACoefficients(n: number): number[] {
  // Coeficientes aproximados para Shapiro-Wilk
  // En producción, usar tabla estándar
  const coeffs: number[] = [];
  for (let i = 0; i < n; i++) {
    const m = i + 1;
    const approx = Math.sqrt(2 / (n + 1)) * (m - (n + 1) / 2);
    coeffs.push(approx);
  }
  return coeffs;
}

/**
 * Aproximación del p-valor para Shapiro-Wilk
 */
function approximatePValue(W: number): number {
  // Aproximación simple del p-valor
  // Valores altos de W (>0.95) indican normalidad
  if (W > 0.98) return 0.8;
  if (W > 0.95) return 0.5;
  if (W > 0.90) return 0.2;
  if (W > 0.85) return 0.05;
  return 0.01;
}

/**
 * Interpretar asimetría
 */
function interpretSkewness(skewness: number): string {
  if (Math.abs(skewness) < 0.5) return "✓ Simétrica (aceptable para normalidad)";
  if (Math.abs(skewness) < 1) return "⚠️ Moderadamente sesgada";
  return "🔴 Fuertemente sesgada (no normal)";
}

/**
 * Interpretar curtosis
 */
function interpretKurtosis(kurtosis: number): string {
  if (Math.abs(kurtosis - 3) < 0.5) return "✓ Mesocúrtica (similar a normal)";
  if (kurtosis > 3.5) return "⚠️ Leptocúrtica (picos altos, colas pesadas)";
  if (kurtosis < 2.5) return "⚠️ Platicúrtica (picos bajos, colas livianas)";
  return "✓ Curtosis aceptable";
}

/**
 * Obtener recomendaciones según resultados
 */
function getRecommendations(
  isNormal: boolean,
  skewness: number,
  kurtosis: number,
  //pValue: number
): string[] {
  const recommendations: string[] = [];
  
  if (isNormal) {
    recommendations.push("✅ Los datos siguen una distribución normal. Puede proceder con el análisis de capacidad estándar (Cp, Cpk).");
  } else {
    recommendations.push("⚠️ Los datos NO siguen una distribución normal.");
    recommendations.push("📊 Se recomienda una de las siguientes opciones:");
    
    if (skewness > 0.5) {
      recommendations.push("   📌 Opción 1: Aplicar transformación Logarítmica (λ=0) para corregir sesgo positivo");
      recommendations.push("   📌 Opción 2: Aplicar transformación Raíz Cuadrada (λ=0.5)");
    } else if (skewness < -0.5) {
      recommendations.push("   📌 Opción 1: Aplicar transformación 1/x o x²");
    }
    
    if (kurtosis > 4) {
      recommendations.push("   📌 Opción 2: Aplicar transformación Box-Cox para reducir curtosis");
    }
    
    recommendations.push("   📌 Opción 3: Usar límites empíricos basados en percentiles");
    recommendations.push("   📌 Opción 4: Continuar con análisis estándar (reconociendo la imprecisión)");
  }
  
  return recommendations;
}

/**
 * Generar datos para gráfico Q-Q
 */
export function generateQQData(data: number[]): { theoretical: number[]; sample: number[] } {
  const sortedData = [...data].sort((a, b) => a - b);
  const n = data.length;
  //const mean = data.reduce((a, b) => a + b, 0) / n;
  //const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  //const stdDev = Math.sqrt(variance);
  
  const theoretical: number[] = [];
  const sample: number[] = [];
  
  for (let i = 0; i < n; i++) {
    const probability = (i + 0.5) / n;
    // Aproximación del percentil normal
    const z = Math.sqrt(2) * inverseErrorFunction(2 * probability - 1);
    theoretical.push(z);
    sample.push(sortedData[i]);
  }
  
  return { theoretical, sample };
}

/**
 * Función inversa de error (aproximación)
 */
function inverseErrorFunction(x: number): number {
  const a = 0.147;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  
  const part1 = 2 / (Math.PI * a) + Math.log(1 - Math.pow(absX, 2)) / 2;
  const part2 = Math.sqrt(Math.pow(2 / (Math.PI * a), 2) - Math.log(1 - Math.pow(absX, 2)) / a);
  const result = sign * Math.sqrt(part1 - part2);
  
  return result || 0;
}

/**
 * Prueba completa de normalidad
 */
export function testNormality(data: number[]): NormalityResult {
  if (data.length < 5) {
    return {
      isNormal: false,
      shapiroWilk: { statistic: 0, pValue: 0, interpretation: "Muestra demasiado pequeña (n<5)" },
      skewness: { value: 0, interpretation: "No calculable" },
      kurtosis: { value: 0, interpretation: "No calculable" },
      recommendations: ["⚠️ Se necesitan al menos 5 datos para evaluar normalidad."],
      qqData: { theoretical: [], sample: [] }
    };
  }
  
  const skewness = calculateSkewness(data);
  const kurtosis = calculateKurtosis(data);
  const shapiro = calculateShapiroWilk(data);
  const qqData = generateQQData(data);
  
  // Criterios para considerar normalidad
  const isNormalByShapiro = shapiro.pValue >= 0.05;
  const isNormalBySkewness = Math.abs(skewness) < 1;
  const isNormalByKurtosis = Math.abs(kurtosis - 3) < 1;
  
  // Decisión final
  const isNormal = isNormalByShapiro && isNormalBySkewness && isNormalByKurtosis;
  
  const recommendations = getRecommendations(isNormal, skewness, kurtosis);
  
  return {
    isNormal,
    shapiroWilk: {
      statistic: shapiro.statistic,
      pValue: shapiro.pValue,
      interpretation: shapiro.pValue >= 0.05 
        ? "✓ No se rechaza normalidad (p ≥ 0.05)"
        : "✗ Se rechaza normalidad (p < 0.05)"
    },
    skewness: {
      value: skewness,
      interpretation: interpretSkewness(skewness)
    },
    kurtosis: {
      value: kurtosis,
      interpretation: interpretKurtosis(kurtosis)
    },
    recommendations,
    qqData
  };
}