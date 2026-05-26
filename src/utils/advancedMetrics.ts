export interface PowerAnalysisResult {
  delta: number;           // Magnitud del cambio en sigma
  n: number;               // Tamaño del subgrupo
  beta: number;            // Probabilidad de no detectar (Error Tipo II)
  power: number;           // Potencia (1 - beta)
  arl1: number;            // ARL cuando está fuera de control
  interpretation: string;  // Interpretación del resultado
}

export interface ARLResult {
  arl0: number;            // ARL en control (falsas alarmas)
  arl1: number;            // ARL fuera de control
  ats0: number;            // ATS en control (horas)
  ats1: number;            // ATS fuera de control (horas)
}

export interface SampleLoadResult {
  n: number;               // Tamaño del subgrupo
  samplingTime: number;    // Tiempo entre muestras (horas)
  loadPerHour: number;     // Carga muestral (mediciones/hora)
  arl1: number;            // ARL1 para este escenario
  ats: number;             // ATS en horas
  recommendation: string;  // Recomendación
}

/**
 * Función de distribución acumulada normal estándar
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
 * Calcula ARL₀ (Average Run Length para proceso en control)
 * ARL₀ = 1 / α
 * Para límites 3σ, α = 0.0027, ARL₀ ≈ 370
 */
export function calculateARL0(alpha: number = 0.0027): number {
  return 1 / alpha;
}

/**
 * Calcula la potencia y beta para un cambio dado
 * Según documento página 50-51
 * β = Φ(3 - δ√n) - Φ(-3 - δ√n)
 * Potencia = 1 - β
 */
export function calculatePower(
  n: number,      // Tamaño del subgrupo
  delta: number   // Magnitud del cambio en sigma (ej: 1 = cambio de 1 sigma)
): PowerAnalysisResult {
  const sqrtN = Math.sqrt(n);
  const z1 = 3 - delta * sqrtN;
  const z2 = -3 - delta * sqrtN;
  
  const beta = normCdf(z1) - normCdf(z2);
  const power = 1 - beta;
  const arl1 = 1 / power;
  
  let interpretation = '';
  if (power >= 0.9) {
    interpretation = '✓ Excelente: 90%+ de probabilidad de detectar en el primer subgrupo';
  } else if (power >= 0.8) {
    interpretation = '✓ Buena: 80%+ de probabilidad de detectar en el primer subgrupo';
  } else if (power >= 0.5) {
    interpretation = '⚠️ Aceptable: 50-80% de probabilidad de detectar';
  } else if (power >= 0.3) {
    interpretation = '⚠️ Baja: 30-50% de probabilidad. Considere aumentar n';
  } else {
    interpretation = '🔴 Muy baja: <30% de probabilidad. Aumente n o frecuencia de muestreo';
  }
  
  return {
    delta,
    n,
    beta,
    power,
    arl1,
    interpretation
  };
}

/**
 * Calcula ARL₁ para un cambio dado
 * ARL₁ = 1 / (1 - β) = 1 / Potencia
 */
export function calculateARL1(n: number, delta: number): number {
  const sqrtN = Math.sqrt(n);
  const z1 = 3 - delta * sqrtN;
  const z2 = -3 - delta * sqrtN;
  const beta = normCdf(z1) - normCdf(z2);
  return 1 / (1 - beta);
}

/**
 * Calcula ATS (Average Time to Signal)
 * ATS = ARL × tiempo_entre_muestras
 */
export function calculateATS(arl: number, samplingTimeHours: number): number {
  return arl * samplingTimeHours;
}

/**
 * Calcula la carga muestral (mediciones por hora)
 * CM = n / tiempo_entre_muestras
 */
export function calculateSampleLoad(n: number, samplingTimeHours: number): number {
  return n / samplingTimeHours;
}

/**
 * Analiza diferentes escenarios de muestreo
 * Según documento página 55-56
 */
export function analyzeSamplingStrategies(
  currentN: number,
  currentSamplingTime: number
): SampleLoadResult[] {
  const strategies: SampleLoadResult[] = [];
  
  // Escenarios a analizar
  const scenarios = [
    { n: 3, samplingTime: 0.5, name: 'Muestreo frecuente, n pequeño' },
    { n: 5, samplingTime: 1, name: 'Muestreo equilibrado' },
    { n: 10, samplingTime: 2, name: 'Muestreo espaciado, n grande' },
    { n: 10, samplingTime: 4, name: 'Muestreo muy espaciado' }
  ];
  
  for (const scenario of scenarios) {
    const power = calculatePower(scenario.n, 1); // Cambio de 1 sigma
    const arl1 = power.arl1;
    const ats = arl1 * scenario.samplingTime;
    const loadPerHour = scenario.n / scenario.samplingTime;
    
    let recommendation = '';
    if (scenario.n === currentN && scenario.samplingTime === currentSamplingTime) {
      recommendation = '✓ Escenario actual';
    } else if (loadPerHour <= 10 && arl1 <= 5) {
      recommendation = '✓ Recomendado: Balance óptimo';
    } else if (arl1 <= 3) {
      recommendation = '✓ Excelente para detección rápida';
    } else if (loadPerHour <= 5) {
      recommendation = '✓ Bajo esfuerzo de inspección';
    } else {
      recommendation = '⚠️ Alto esfuerzo de inspección';
    }
    
    strategies.push({
      n: scenario.n,
      samplingTime: scenario.samplingTime,
      loadPerHour,
      arl1,
      ats,
      recommendation
    });
  }
  
  return strategies;
}

/**
 * Calcula la tabla de potencia para diferentes n y δ
 * Según documento página 51
 */
export function getPowerTable(): { deltas: number[]; nValues: number[]; powerMatrix: number[][] } {
  const deltas = [0.5, 1.0, 1.5, 2.0];
  const nValues = [1, 3, 5, 10];
  const powerMatrix: number[][] = [];
  
  for (const delta of deltas) {
    const row: number[] = [];
    for (const n of nValues) {
      const result = calculatePower(n, delta);
      row.push(result.power);
    }
    powerMatrix.push(row);
  }
  
  return { deltas, nValues, powerMatrix };
}

/**
 * Calcula la Curva OC (Operating Characteristic)
 * Para diferentes tamaños de subgrupo
 */
export function getOCCurveData(n: number): { deltas: number[]; beta: number[]; power: number[] } {
  const deltas: number[] = [];
  const betas: number[] = [];
  const powers: number[] = [];
  
  for (let delta = 0; delta <= 3; delta += 0.1) {
    const sqrtN = Math.sqrt(n);
    const z1 = 3 - delta * sqrtN;
    const z2 = -3 - delta * sqrtN;
    const beta = normCdf(z1) - normCdf(z2);
    deltas.push(Number(delta.toFixed(1)));
    betas.push(Number(beta.toFixed(4)));
    powers.push(Number((1 - beta).toFixed(4)));
  }
  
  return { deltas, beta: betas, power: powers };
}

/**
 * Obtiene recomendación según ARL y ATS
 */
export function getPerformanceRecommendation(
  arl0: number,
  arl1: number,
  //ats0Hours: number,
  //ats1Hours: number
): string {
  if (arl0 >= 370 && arl1 <= 5) {
    return '✅ Excelente rendimiento: Bajas falsas alarmas (1 cada ~370 subgrupos) y detección rápida (promedio ~5 subgrupos para detectar cambio de 1σ)';
  }
  
  if (arl0 >= 200 && arl1 <= 10) {
    return '✅ Buen rendimiento: Sistema de control efectivo para la mayoría de aplicaciones';
  }
  
  if (arl0 >= 100 && arl1 <= 20) {
    return '⚠️ Rendimiento aceptable: Considere aumentar tamaño de subgrupo o frecuencia de muestreo';
  }
  
  if (arl1 > 20) {
    return '🔴 Detección lenta: Aumente n (tamaño de subgrupo) o frecuencia de muestreo para detectar cambios más rápido';
  }
  
  if (arl0 < 100) {
    return '🔴 Demasiadas falsas alarmas: Reduzca frecuencia de muestreo o considere límites de control más amplios';
  }
  
  return '⚠️ Revise parámetros de muestreo para optimizar el sistema';
}

/**
 * Calcula todas las métricas avanzadas
 */
export function calculateAllAdvancedMetrics(
  n: number,
  samplingTimeHours: number,
  //currentProcessSigma?: number
): {
  arl0: number;
  arl1_for_delta_1: number;
  arl1_for_delta_0_5: number;
  arl1_for_delta_1_5: number;
  arl1_for_delta_2: number;
  ats0: number;
  ats1_for_delta_1: number;
  sampleLoad: number;
  recommendations: string;
} {
  const arl0 = calculateARL0();
  const powerDelta0_5 = calculatePower(n, 0.5);
  const powerDelta1 = calculatePower(n, 1);
  const powerDelta1_5 = calculatePower(n, 1.5);
  const powerDelta2 = calculatePower(n, 2);
  
  const arl1_for_delta_0_5 = powerDelta0_5.arl1;
  const arl1_for_delta_1 = powerDelta1.arl1;
  const arl1_for_delta_1_5 = powerDelta1_5.arl1;
  const arl1_for_delta_2 = powerDelta2.arl1;
  
  const ats0 = arl0 * samplingTimeHours;
  const ats1_for_delta_1 = arl1_for_delta_1 * samplingTimeHours;
  const sampleLoad = n / samplingTimeHours;
  
  const recommendations = getPerformanceRecommendation(arl0, arl1_for_delta_1);
  
  return {
    arl0,
    arl1_for_delta_1,
    arl1_for_delta_0_5,
    arl1_for_delta_1_5,
    arl1_for_delta_2,
    ats0,
    ats1_for_delta_1,
    sampleLoad,
    recommendations
  };
}