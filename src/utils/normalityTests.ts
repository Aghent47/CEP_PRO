/**
 * Pruebas de Normalidad - Simplificada (Solo Shapiro-Wilk)
 * 
 * CRITERIO ESTADÍSTICO SEGÚN DOCUMENTO:
 * 
 * Prueba de Shapiro-Wilk (Validación Analítica Principal):
 *    - p-value > 0.05 → ACEPTA normalidad (H0)
 *    - p-value ≤ 0.05 → RECHAZA normalidad (datos no normales)
 *    - El límite SIEMPRE es 0.05, sin importar el tamaño de muestra
 */

export interface NormalityResult {
  isNormal: boolean;
  shapiroWilk: {
    statistic: number;
    pValue: number;
    interpretation: string;
    verdict: 'ACEPTA_NORMALIDAD' | 'RECHAZA_NORMALIDAD';
  };
  qqData: { theoretical: number[]; sample: number[] };
  qqInterpretation: string;
  recommendations: string[];
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
 * Obtener recomendaciones según resultado de Shapiro-Wilk
 */
function getRecommendations(isNormal: boolean): string[] {
  const recommendations: string[] = [];
  
  if (isNormal) {
    recommendations.push("✅ Los datos siguen una distribución normal. Puede proceder con el análisis de capacidad estándar (Cp, Cpk).");
  } else {
    recommendations.push("⚠️ Los datos NO siguen una distribución normal según la prueba de Shapiro-Wilk.");
    recommendations.push("📊 Se recomienda una de las siguientes opciones:");
    recommendations.push("   📌 Transformación Logarítmica (λ=0) para corregir sesgo positivo");
    recommendations.push("   📌 Transformación Raíz Cuadrada (λ=0.5)");
    recommendations.push("   📌 Transformación Box-Cox");
    recommendations.push("   📌 Usar límites empíricos basados en percentiles");
    recommendations.push("   📌 Continuar con análisis estándar (reconociendo la imprecisión)");
  }
  
  return recommendations;
}

/**
 * Prueba completa de normalidad (SOLO Shapiro-Wilk)
 * La decisión final se basa ÚNICAMENTE en el p-value de Shapiro-Wilk
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
      qqData: { theoretical: [], sample: [] },
      qqInterpretation: "No se puede generar Q-Q plot con muestra pequeña",
      recommendations: ["⚠️ Se necesitan al menos 5 datos para evaluar normalidad."]
    };
  }
  
  // Calcular Shapiro-Wilk
  const shapiro = calculateShapiroWilk(data);
  const qqData = generateQQData(data);
  
  // Interpretar resultados
  const shapiroResult = interpretShapiroWilk(shapiro.pValue);
  const qqInterpretation = interpretQQ(qqData.theoretical, qqData.sample);
  
  // Decisión final de normalidad (SOLO basada en Shapiro-Wilk)
  const isNormal = shapiroResult.verdict === 'ACEPTA_NORMALIDAD';
  
  const recommendations = getRecommendations(isNormal);
  
  return {
    isNormal,
    shapiroWilk: {
      statistic: shapiro.statistic,
      pValue: shapiro.pValue,
      interpretation: shapiroResult.interpretation,
      verdict: shapiroResult.verdict
    },
    qqData,
    qqInterpretation,
    recommendations
  };
}