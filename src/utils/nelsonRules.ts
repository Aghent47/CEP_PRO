export interface NelsonViolation {
  ruleId: number;
  ruleName: string;
  description: string;
  points: number[]; // Índices de subgrupos que violan la regla
  severity: 'high' | 'medium' | 'low';
}

export interface SubgroupZones {
  value: number;
  zone: 'A+' | 'B+' | 'C' | 'B-' | 'A-';
  side: 'positive' | 'negative' | 'center';
}

// Calcular las zonas para cada punto (basado en sigma)
export function calculateZones(
  values: number[],
  centerLine: number,
  sigma: number
): SubgroupZones[] {
  return values.map((value) => {
    const deviation = value - centerLine;
    const sigmaLevel = Math.abs(deviation) / sigma;
    
    let zone: SubgroupZones['zone'];
    let side: SubgroupZones['side'];
    
    if (deviation > 0) {
      side = 'positive';
      if (sigmaLevel >= 3) zone = 'A+';
      else if (sigmaLevel >= 2) zone = 'B+';
      else zone = 'C';
    } else if (deviation < 0) {
      side = 'negative';
      if (sigmaLevel >= 3) zone = 'A-';
      else if (sigmaLevel >= 2) zone = 'B-';
      else zone = 'C';
    } else {
      side = 'center';
      zone = 'C';
    }
    
    return { value, zone, side };
  });
}

// Regla 1: Cualquier punto fuera de los límites de control (3σ)
export function rule1OutOfControl(
  values: number[],
  ucl: number,
  lcl: number
): NelsonViolation | null {
  const outOfControlPoints: number[] = [];
  
  values.forEach((value, index) => {
    if (value > ucl || value < lcl) {
      outOfControlPoints.push(index);
    }
  });
  
  if (outOfControlPoints.length > 0) {
    return {
      ruleId: 1,
      ruleName: "Regla 1 - Fuera de Control",
      description: `Un punto fuera de los límites de control (3σ)`,
      points: outOfControlPoints,
      severity: 'high'
    };
  }
  return null;
}

// Regla 2: Dos de tres puntos consecutivos en la zona A (2σ-3σ) o más allá
export function rule2TwoOfThreeInZoneA(
  values: number[],
  centerLine: number,
  sigma: number
): NelsonViolation | null {
  const zones = calculateZones(values, centerLine, sigma);
  const violations: number[] = [];
  
  for (let i = 0; i <= zones.length - 3; i++) {
    const window = zones.slice(i, i + 3);
    const zoneAIndices = window
      .map((z, idx) => ({ zone: z.zone, idx: i + idx }))
      .filter(z => z.zone === 'A+' || z.zone === 'A-');
    
    if (zoneAIndices.length >= 2) {
      zoneAIndices.forEach(z => violations.push(z.idx));
    }
  }
  
  if (violations.length > 0) {
    return {
      ruleId: 2,
      ruleName: "Regla 2 - Zona A",
      description: `Dos de tres puntos consecutivos en la zona A (2σ-3σ)`,
      points: [...new Set(violations)],
      severity: 'high'
    };
  }
  return null;
}

// Regla 3: Cuatro de cinco puntos consecutivos en la zona B (1σ-2σ) o más allá
export function rule3FourOfFiveInZoneB(
  values: number[],
  centerLine: number,
  sigma: number
): NelsonViolation | null {
  const zones = calculateZones(values, centerLine, sigma);
  const violations: number[] = [];
  
  for (let i = 0; i <= zones.length - 5; i++) {
    const window = zones.slice(i, i + 5);
    const zoneBOrBeyond = window
      .map((z, idx) => ({ zone: z.zone, idx: i + idx }))
      .filter(z => z.zone === 'A+' || z.zone === 'B+' || z.zone === 'A-' || z.zone === 'B-');
    
    if (zoneBOrBeyond.length >= 4) {
      zoneBOrBeyond.forEach(z => violations.push(z.idx));
    }
  }
  
  if (violations.length > 0) {
    return {
      ruleId: 3,
      ruleName: "Regla 3 - Zona B",
      description: `Cuatro de cinco puntos consecutivos en la zona B (1σ-2σ) o más allá`,
      points: [...new Set(violations)],
      severity: 'medium'
    };
  }
  return null;
}

// Regla 4: Ocho puntos consecutivos del mismo lado de la línea central
export function rule4EightOnSameSide(
  values: number[],
  centerLine: number
): NelsonViolation | null {
  const violations: number[] = [];
  let consecutiveCount = 0;
  let currentSide: 'positive' | 'negative' | null = null;
  
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const side = value > centerLine ? 'positive' : value < centerLine ? 'negative' : 'center';
    
    if (side === 'center') {
      consecutiveCount = 0;
      currentSide = null;
      continue;
    }
    
    if (currentSide === null) {
      currentSide = side;
      consecutiveCount = 1;
    } else if (currentSide === side) {
      consecutiveCount++;
    } else {
      currentSide = side;
      consecutiveCount = 1;
    }
    
    if (consecutiveCount >= 8) {
      for (let j = i - consecutiveCount + 1; j <= i; j++) {
        violations.push(j);
      }
    }
  }
  
  if (violations.length > 0) {
    return {
      ruleId: 4,
      ruleName: "Regla 4 - Tendencia Central",
      description: `Ocho puntos consecutivos del mismo lado de la línea central`,
      points: [...new Set(violations)],
      severity: 'medium'
    };
  }
  return null;
}

// Regla 5: Seis puntos consecutivos en tendencia (creciente o decreciente)
export function rule5SixPointTrend(
  values: number[]
): NelsonViolation | null {
  const violations: number[] = [];
  let consecutiveUp = 0;
  let consecutiveDown = 0;
  
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    
    if (diff > 0) {
      consecutiveUp++;
      consecutiveDown = 0;
    } else if (diff < 0) {
      consecutiveDown++;
      consecutiveUp = 0;
    } else {
      consecutiveUp = 0;
      consecutiveDown = 0;
    }
    
    if (consecutiveUp >= 6) {
      for (let j = i - consecutiveUp; j <= i; j++) {
        violations.push(j);
      }
    }
    
    if (consecutiveDown >= 6) {
      for (let j = i - consecutiveDown; j <= i; j++) {
        violations.push(j);
      }
    }
  }
  
  if (violations.length > 0) {
    return {
      ruleId: 5,
      ruleName: "Regla 5 - Tendencia",
      description: `Seis puntos consecutivos en tendencia (creciente o decreciente)`,
      points: [...new Set(violations)],
      severity: 'medium'
    };
  }
  return null;
}

// Regla 6: Catorce puntos consecutivos alternando arriba y abajo
export function rule6FourteenAlternating(
  values: number[],
  centerLine: number
): NelsonViolation | null {
  const violations: number[] = [];
  let alternatingCount = 0;
  
  for (let i = 1; i < values.length; i++) {
    const prevSide = values[i - 1] > centerLine;
    const currSide = values[i] > centerLine;
    
    if (prevSide !== currSide) {
      alternatingCount++;
    } else {
      alternatingCount = 0;
    }
    
    if (alternatingCount >= 13) { // 14 puntos requieren 13 alternancias
      for (let j = i - alternatingCount; j <= i; j++) {
        violations.push(j);
      }
    }
  }
  
  if (violations.length > 0) {
    return {
      ruleId: 6,
      ruleName: "Regla 6 - Alternancia",
      description: `Catorce puntos consecutivos alternando arriba y abajo de la línea central`,
      points: [...new Set(violations)],
      severity: 'low'
    };
  }
  return null;
}

// Función principal que ejecuta todas las reglas
export function applyAllNelsonRules(
  values: number[],
  centerLine: number,
  ucl: number,
  lcl: number,
  sigma: number
): NelsonViolation[] {
  const violations: NelsonViolation[] = [];
  
  // Aplicar cada regla
  const rule1 = rule1OutOfControl(values, ucl, lcl);
  const rule2 = rule2TwoOfThreeInZoneA(values, centerLine, sigma);
  const rule3 = rule3FourOfFiveInZoneB(values, centerLine, sigma);
  const rule4 = rule4EightOnSameSide(values, centerLine);
  const rule5 = rule5SixPointTrend(values);
  const rule6 = rule6FourteenAlternating(values, centerLine);
  
  if (rule1) violations.push(rule1);
  if (rule2) violations.push(rule2);
  if (rule3) violations.push(rule3);
  if (rule4) violations.push(rule4);
  if (rule5) violations.push(rule5);
  if (rule6) violations.push(rule6);
  
  return violations;
}

// Obtener todos los puntos que violan alguna regla
export function getAllViolationPoints(violations: NelsonViolation[]): number[] {
  const allPoints: number[] = [];
  violations.forEach(violation => {
    allPoints.push(...violation.points);
  });
  return [...new Set(allPoints)];
}

// Obtener el severity más alto entre las violaciones
export function getHighestSeverity(violations: NelsonViolation[]): 'high' | 'medium' | 'low' | null {
  if (violations.some(v => v.severity === 'high')) return 'high';
  if (violations.some(v => v.severity === 'medium')) return 'medium';
  if (violations.some(v => v.severity === 'low')) return 'low';
  return null;
}