/**
 * Reglas de Nelson - Simplificadas para Fase I (Solo Regla 1)
 * 
 * En Fase I de estabilización, solo se detectan puntos fuera de límites 3σ
 * Las reglas 2-8 se eliminan completamente en esta fase
 */

export interface NelsonViolation {
  ruleId: number;
  ruleName: string;
  description: string;
  points: number[];
  severity: 'high' | 'medium' | 'low';
}

/**
 * REGLA 1: Punto fuera de límites 3σ (ÚNICA REGLA EN FASE I)
 */
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
      description: `Uno o más puntos fuera de los límites de control (3σ)`,
      points: outOfControlPoints,
      severity: 'high'
    };
  }
  return null;
}

/**
 * REGLA 1 SOLO - Para Fase I (Estabilización)
 * Aplica únicamente la Regla 1, ignorando completamente las reglas 2-8
 */
export function applyPhaseIRules(
  values: number[],
  ucl: number,
  lcl: number
): NelsonViolation[] {
  const violations: NelsonViolation[] = [];
  
  // SOLO Regla 1 - Fuera de control
  const rule1 = rule1OutOfControl(values, ucl, lcl);
  if (rule1) violations.push(rule1);
  
  return violations;
}

/**
 * Obtener todos los puntos que violan alguna regla (solo Regla 1 en Fase I)
 */
export function getAllViolationPoints(violations: NelsonViolation[]): number[] {
  const allPoints: number[] = [];
  violations.forEach(violation => {
    allPoints.push(...violation.points);
  });
  return [...new Set(allPoints)];
}

/**
 * Obtener el severity más alto entre las violaciones
 */
export function getHighestSeverity(violations: NelsonViolation[]): 'high' | 'medium' | 'low' | null {
  if (violations.some(v => v.severity === 'high')) return 'high';
  if (violations.some(v => v.severity === 'medium')) return 'medium';
  if (violations.some(v => v.severity === 'low')) return 'low';
  return null;
}

// ============ LAS SIGUIENTES REGLAS ESTÁN DESHABILITADAS EN FASE I ============
// Se mantienen exportadas pero NO se usan en Fase I
// Si se necesitaran en el futuro para otra fase, están disponibles

export function rule2TwoOfThreeInZoneA(): null { return null; }
export function rule3FourOfFiveInZoneB(): null { return null; }
export function rule4EightOnSameSide(): null { return null; }
export function rule5SixPointTrend(): null { return null; }
export function rule6FourteenAlternating(): null { return null; }
export function rule7OnePointInZoneA(): null { return null; }
export function rule8FifteenInZoneC(): null { return null; }

// Versión completa de reglas (NO USAR EN FASE I)
export function applyAllNelsonRules(): NelsonViolation[] {
  return [];
}