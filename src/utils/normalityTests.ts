/**
 * Pruebas de Normalidad según documento de correcciones (Punto 6)
 * 
 * CRITERIOS ESTADÍSTICOS SEGÚN DOCUMENTO:
 * 
 * 1. Gráfico Q-Q (Validación Visual):
 *    - Los puntos deben seguir la línea diagonal roja
 *    - Si se separan formando "S" o "C" → no normal
 * 
 * 2. Prueba de Shapiro-Wilk (Validación Analítica):
 *    - p-value > 0.05 → ACEPTA normalidad (H0)
 *    - p-value ≤ 0.05 → RECHAZA normalidad (datos no normales)
 *    - El límite SIEMPRE es 0.05, sin importar el tamaño de muestra
 * 
 * 3. Skewness (Asimetría) - Métrica de Forma Lateral:
 *    - Rango aceptable: -0.5 a 0.5 (estricto para control de calidad)
 *    - Si > 0.5 → sesgo positivo (cola derecha larga)
 *    - Si < -0.5 → sesgo negativo (cola izquierda larga)
 *    - En distribución normal perfecta: skewness = 0
 * 
 * 4. Kurtosis (Curtosis) - Métrica de Forma Vertical/Colas:
 *    - Curtosis teórica normal = 3
 *    - Rango aceptable para curtosis: 2.5 a 3.5
 *    - Si > 3.5 → Leptocúrtica (muy puntiaguda, colas pesadas)
 *    - Si < 2.5 → Platicúrtica (muy plana, colas livianas)
 */

export interface NormalityResult {
  isNormal: boolean;
  shapiroWilk: {
    statistic: number;
    pValue: number;
    interpretation: string;
    verdict: 'ACEPTA_NORMALIDAD' | 'RECHAZA_NORMALIDAD';
  };
  skewness: {
    value: number;
    interpretation: string;
    verdict: 'NORMAL' | 'SESGO_POSITIVO' | 'SESGO_NEGATIVO';
  };
  kurtosis: {
    value: number;
    interpretation: string;
    verdict: 'NORMAL' | 'LEPTOCURTICA' | 'PLATICURTICA';
  };
  qqData: { theoretical: number[]; sample: number[] };
  qqInterpretation: string;
  recommendations: string[];
}

/**
 * Calcula la asimetría (skewness)
 * Fórmula: skewness = E[(X - μ)/σ]³
 */
export function calculateSkewness(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  const skewness = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / n;
  return skewness;
}

/**
 * Calcula la curtosis (kurtosis)
 * Fórmula: kurtosis = E[(X - μ)/σ]⁴
 * Nota: Curtosis teórica normal = 3
 */
export function calculateKurtosis(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 3;
  const kurtosis = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / n;
  return kurtosis;
}

/**
 * Prueba de Shapiro-Wilk (Validación Analítica Principal)
 * 
 * Según documento:
 * - Calcula matemáticamente la probabilidad (p-value) de que la muestra
 *   provenga de una distribución normal.
 * - SI p-value > 0.05 → ACEPTA normalidad (H0)
 * - SI p-value ≤ 0.05 → RECHAZA normalidad
 * 
 * El límite SIEMPRE es 0.05, sin importar el tamaño de muestra.
 */
export function calculateShapiroWilk(data: number[]): { statistic: number; pValue: number } {
  const n = data.length;
  
  if (n < 3) {
    return { statistic: 1, pValue: 1 };
  }
  
  // 1. Ordenar datos de menor a mayor
  const sortedData = [...data].sort((a, b) => a - b);
  
  // 2. Calcular la media
  const mean = data.reduce((a, b) => a + b, 0) / n;
  
  // 3. Calcular suma de cuadrados total (denominador S²)
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    s2 += Math.pow(data[i] - mean, 2);
  }
  
  if (s2 === 0) {
    return { statistic: 1, pValue: 1 };
  }
  
  // 4. Calcular los coeficientes m_i (esperanzas de estadísticos de orden normal)
  const m: number[] = [];
  for (let i = 1; i <= n; i++) {
    // Aproximación de Blom (1958): p = (i - 0.375) / (n + 0.25)
    const p = (i - 0.375) / (n + 0.25);
    let z = 0;
    if (p < 0.5) {
      z = -Math.sqrt(2) * Math.sqrt(-Math.log(2 * p));
    } else {
      z = Math.sqrt(2) * Math.sqrt(-Math.log(2 * (1 - p)));
    }
    m.push(z);
  }
  
  // 5. Calcular los coeficientes a_i (normalizados)
  let sumMSq = 0;
  for (let i = 0; i < n; i++) {
    sumMSq += m[i] * m[i];
  }
  const sqrtSumMSq = Math.sqrt(sumMSq);
  const a: number[] = [];
  for (let i = 0; i < n; i++) {
    a.push(m[i] / sqrtSumMSq);
  }
  
  // 6. Calcular el numerador: (Σ a_i * x_i)²
  let sumAx = 0;
  for (let i = 0; i < n; i++) {
    sumAx += a[i] * sortedData[i];
  }
  const numerator = sumAx * sumAx;
  
  // 7. Calcular W
  let W = numerator / s2;
  
  // Asegurar que W esté entre 0 y 1
  W = Math.min(0.9999, Math.max(0.0001, W));
  
  // 8. Calcular p-value según Royston (1992)
  let pValue = 0.5;
  
  if (n >= 4 && n <= 2000) {
    const y = Math.log(1 - W);
    let mu = 0;
    let sigma = 0;
    
    if (n <= 50) {
      mu = -1.2725 + 0.4598 * Math.log(n);
      sigma = 0.8814 - 0.0882 * Math.log(n);
    } else {
      mu = -0.9532 + 0.4733 * Math.log(n);
      sigma = 0.7385 - 0.0599 * Math.log(n);
    }
    
    const z = (y - mu) / sigma;
    pValue = 1 - normalCDF(z);
  } else {
    // Para muestras muy pequeñas
    if (W > 0.98) pValue = 0.8;
    else if (W > 0.95) pValue = 0.5;
    else if (W > 0.90) pValue = 0.2;
    else if (W > 0.85) pValue = 0.05;
    else pValue = 0.01;
  }
  
  // Ajustar p-value al rango [0,1]
  pValue = Math.min(0.9999, Math.max(0.0001, pValue));
  
  return { statistic: W, pValue };
}

/**
 * Función de distribución acumulada normal estándar
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return z > 0 ? 1 - p : p;
}

/**
 * Generar datos para gráfico Q-Q
 */
export function generateQQData(data: number[]): { theoretical: number[]; sample: number[] } {
  const sortedData = [...data].sort((a, b) => a - b);
  const n = data.length;
  const theoretical: number[] = [];
  const sample: number[] = [];
  
  for (let i = 0; i < n; i++) {
    const probability = (i + 0.5) / n;
    let z = 0;
    if (probability < 0.5) {
      z = -Math.sqrt(2) * Math.sqrt(-Math.log(2 * probability));
    } else {
      z = Math.sqrt(2) * Math.sqrt(-Math.log(2 * (1 - probability)));
    }
    theoretical.push(z);
    sample.push(sortedData[i]);
  }
  
  return { theoretical, sample };
}

/**
 * Interpretar Skewness según criterios del documento
 * Rango aceptable: -0.5 a 0.5
 */
function interpretSkewness(skewness: number): {
  interpretation: string;
  verdict: 'NORMAL' | 'SESGO_POSITIVO' | 'SESGO_NEGATIVO';
} {
  if (Math.abs(skewness) <= 0.5) {
    return {
      interpretation: `✓ Simétrica (${skewness.toFixed(4)} está dentro del rango aceptable -0.5 a 0.5)`,
      verdict: 'NORMAL'
    };
  }
  if (skewness > 0.5) {
    return {
      interpretation: `⚠️ Sesgo positivo (${skewness.toFixed(4)} > 0.5). La cola se extiende hacia la derecha.`,
      verdict: 'SESGO_POSITIVO'
    };
  }
  return {
    interpretation: `⚠️ Sesgo negativo (${skewness.toFixed(4)} < -0.5). La cola se extiende hacia la izquierda.`,
    verdict: 'SESGO_NEGATIVO'
  };
}

/**
 * Interpretar Kurtosis según criterios del documento
 * Rango aceptable: 2.5 a 3.5 (curtosis normal = 3)
 */
function interpretKurtosis(kurtosis: number): {
  interpretation: string;
  verdict: 'NORMAL' | 'LEPTOCURTICA' | 'PLATICURTICA';
} {
  if (kurtosis >= 2.5 && kurtosis <= 3.5) {
    return {
      interpretation: `✓ Mesocúrtica (${kurtosis.toFixed(4)} está dentro del rango aceptable 2.5 a 3.5)`,
      verdict: 'NORMAL'
    };
  }
  if (kurtosis > 3.5) {
    return {
      interpretation: `⚠️ Leptocúrtica (${kurtosis.toFixed(4)} > 3.5). Curva muy "puntiaguda" y colas pesadas.`,
      verdict: 'LEPTOCURTICA'
    };
  }
  return {
    interpretation: `⚠️ Platicúrtica (${kurtosis.toFixed(4)} < 2.5). Curva muy "plana" y colas livianas.`,
    verdict: 'PLATICURTICA'
  };
}

/**
 * Interpretar Shapiro-Wilk según criterios del documento
 * SI p-value > 0.05 → ACEPTA normalidad
 * SI p-value ≤ 0.05 → RECHAZA normalidad
 */
function interpretShapiroWilk(pValue: number): {
  interpretation: string;
  verdict: 'ACEPTA_NORMALIDAD' | 'RECHAZA_NORMALIDAD';
} {
  if (pValue > 0.05) {
    return {
      interpretation: `✓ p-valor = ${pValue.toFixed(4)} > 0.05 → Se ACEPTA la normalidad (no se rechaza H0)`,
      verdict: 'ACEPTA_NORMALIDAD'
    };
  }
  return {
    interpretation: `✗ p-valor = ${pValue.toFixed(4)} ≤ 0.05 → Se RECHAZA la normalidad (los datos NO son normales)`,
    verdict: 'RECHAZA_NORMALIDAD'
  };
}

/**
 * Interpretar Gráfico Q-Q
 */
function interpretQQ(theoretical: number[], sample: number[]): string {
  // Calcular correlación entre puntos teóricos y muestrales
  const n = theoretical.length;
  const meanX = theoretical.reduce((a, b) => a + b, 0) / n;
  const meanY = sample.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = theoretical[i] - meanX;
    const dy = sample[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  const correlation = numerator / Math.sqrt(denomX * denomY);
  
  if (correlation > 0.98) {
    return "✓ Los puntos siguen la línea diagonal. Los datos son visualmente normales.";
  } else if (correlation > 0.95) {
    return "⚠️ Los puntos están cerca de la línea diagonal. Aceptable para control de calidad.";
  } else {
    return "✗ Los puntos se separan de la línea diagonal (posible forma de 'S' o 'C'). Los datos NO son visualmente normales.";
  }
}

/**
 * Obtener recomendaciones según resultados combinados
 */
function getRecommendations(
  shapiroVerdict: 'ACEPTA_NORMALIDAD' | 'RECHAZA_NORMALIDAD',
  skewnessVerdict: 'NORMAL' | 'SESGO_POSITIVO' | 'SESGO_NEGATIVO',
  kurtosisVerdict: 'NORMAL' | 'LEPTOCURTICA' | 'PLATICURTICA'
): string[] {
  const recommendations: string[] = [];
  
  const allNormal = shapiroVerdict === 'ACEPTA_NORMALIDAD' && 
                     skewnessVerdict === 'NORMAL' && 
                     kurtosisVerdict === 'NORMAL';
  
  if (allNormal) {
    recommendations.push("✅ Los datos siguen una distribución normal. Puede proceder con el análisis de capacidad estándar (Cp, Cpk).");
  } else {
    recommendations.push("⚠️ Los datos NO siguen una distribución normal según uno o más criterios.");
    recommendations.push("📊 Se recomienda una de las siguientes opciones:");
    
    if (skewnessVerdict !== 'NORMAL') {
      if (skewnessVerdict === 'SESGO_POSITIVO') {
        recommendations.push("   📌 Transformación Logarítmica (λ=0) para corregir sesgo positivo");
        recommendations.push("   📌 Transformación Raíz Cuadrada (λ=0.5)");
      } else {
        recommendations.push("   📌 Transformación 1/x o x² para corregir sesgo negativo");
      }
    }
    
    if (kurtosisVerdict !== 'NORMAL') {
      recommendations.push("   📌 Transformación Box-Cox para ajustar la curtosis");
    }
    
    recommendations.push("   📌 Usar límites empíricos basados en percentiles");
    recommendations.push("   📌 Continuar con análisis estándar (reconociendo la imprecisión)");
  }
  
  return recommendations;
}

/**
 * Prueba completa de normalidad
 * Integra todos los criterios del documento
 */
export function testNormality(data: number[]): NormalityResult {
  // Validación de muestra mínima
  if (data.length < 5) {
    return {
      isNormal: false,
      shapiroWilk: { 
        statistic: 0, 
        pValue: 0, 
        interpretation: "Muestra demasiado pequeña (n < 5)",
        verdict: 'RECHAZA_NORMALIDAD'
      },
      skewness: { 
        value: 0, 
        interpretation: "No calculable con muestra pequeña",
        verdict: 'NORMAL'
      },
      kurtosis: { 
        value: 0, 
        interpretation: "No calculable con muestra pequeña",
        verdict: 'NORMAL'
      },
      qqData: { theoretical: [], sample: [] },
      qqInterpretation: "No se puede generar Q-Q plot con muestra pequeña",
      recommendations: ["⚠️ Se necesitan al menos 5 datos para evaluar normalidad."]
    };
  }
  
  // Calcular todas las métricas
  const skewness = calculateSkewness(data);
  const kurtosis = calculateKurtosis(data);
  const shapiro = calculateShapiroWilk(data);
  const qqData = generateQQData(data);
  
  // Interpretar cada prueba
  const skewnessResult = interpretSkewness(skewness);
  const kurtosisResult = interpretKurtosis(kurtosis);
  const shapiroResult = interpretShapiroWilk(shapiro.pValue);
  const qqInterpretation = interpretQQ(qqData.theoretical, qqData.sample);
  
  // Decisión final de normalidad (todos los criterios deben cumplirse)
  const isNormal = shapiroResult.verdict === 'ACEPTA_NORMALIDAD' &&
                   skewnessResult.verdict === 'NORMAL' &&
                   kurtosisResult.verdict === 'NORMAL';
  
  const recommendations = getRecommendations(
    shapiroResult.verdict,
    skewnessResult.verdict,
    kurtosisResult.verdict
  );
  
  return {
    isNormal,
    shapiroWilk: {
      statistic: shapiro.statistic,
      pValue: shapiro.pValue,
      interpretation: shapiroResult.interpretation,
      verdict: shapiroResult.verdict
    },
    skewness: {
      value: skewness,
      interpretation: skewnessResult.interpretation,
      verdict: skewnessResult.verdict
    },
    kurtosis: {
      value: kurtosis,
      interpretation: kurtosisResult.interpretation,
      verdict: kurtosisResult.verdict
    },
    qqData,
    qqInterpretation,
    recommendations
  };
}