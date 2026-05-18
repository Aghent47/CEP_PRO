import { getConstantsForN } from './spcConstants';

export interface SubgroupStats {
  subgroupIndex: number;
  mean: number;
  range: number;
}

export interface XRChartData {
  xbar: {
    values: number[];
    centerLine: number;
    ucl: number;
    lcl: number;
  };
  r: {
    values: number[];
    centerLine: number;
    ucl: number;
    lcl: number;
  };
  subgroups: SubgroupStats[];
  constants: {
    n: number;
    A2: number;
    D3: number;
    D4: number;
    d2: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateDataForXRRChart(
  numericData: number[][],
  subgroupSize: number
): ValidationResult {
  // Validar que hay al menos un subgrupo
  if (numericData.length === 0) {
    return { isValid: false, error: 'No hay datos cargados' };
  }

  // Validar que cada subgrupo tiene el tamaño esperado
  for (let i = 0; i < numericData.length; i++) {
    if (numericData[i].length !== subgroupSize) {
      return {
        isValid: false,
        error: `El subgrupo ${i + 1} tiene ${numericData[i].length} valores, se esperaban ${subgroupSize}`
      };
    }
  }

  // Validar mínimo 2 subgrupos
  if (numericData.length < 2) {
    return { isValid: false, error: 'Se necesitan al menos 2 subgrupos para el análisis' };
  }

  // Validar tamaño de subgrupo entre 2 y 25
  if (subgroupSize < 2 || subgroupSize > 25) {
    return { isValid: false, error: 'El tamaño de subgrupo debe estar entre 2 y 25' };
  }

  return { isValid: true };
}

export function calculateSubgroupStats(
  data: number[][]
): SubgroupStats[] {
  return data.map((subgroup, index) => {
    const mean = subgroup.reduce((sum, val) => sum + val, 0) / subgroup.length;
    const range = Math.max(...subgroup) - Math.min(...subgroup);
    return {
      subgroupIndex: index + 1,
      mean,
      range
    };
  });
}

export function calculateXRChartData(
  data: number[][],
  subgroupSize: number
): XRChartData {
  // Validar datos
  const validation = validateDataForXRRChart(data, subgroupSize);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Calcular estadísticas por subgrupo
  const subgroups = calculateSubgroupStats(data);
  
  // Calcular promedio de medias (X-doble-barra)
  const grandMean = subgroups.reduce((sum, sg) => sum + sg.mean, 0) / subgroups.length;
  
  // Calcular promedio de rangos (R-barra)
  const avgRange = subgroups.reduce((sum, sg) => sum + sg.range, 0) / subgroups.length;
  
  // Obtener constantes para el tamaño de subgrupo
  const constants = getConstantsForN(subgroupSize);
  
  // Calcular límites para gráfico X-bar
  const xbarUcl = grandMean + constants.A2 * avgRange;
  const xbarLcl = grandMean - constants.A2 * avgRange;
  
  // Calcular límites para gráfico R
  const rUcl = constants.D4 * avgRange;
  const rLcl = constants.D3 * avgRange;
  
  return {
    xbar: {
      values: subgroups.map(sg => sg.mean),
      centerLine: grandMean,
      ucl: xbarUcl,
      lcl: xbarLcl
    },
    r: {
      values: subgroups.map(sg => sg.range),
      centerLine: avgRange,
      ucl: rUcl,
      lcl: rLcl
    },
    subgroups,
    constants: {
      n: constants.n,
      A2: constants.A2,
      D3: constants.D3,
      D4: constants.D4,
      d2: constants.d2
    }
  };
}

export function detectOutOfControlPoints(
  values: number[],
  ucl: number,
  lcl: number
): number[] {
  return values
    .map((val, idx) => ({ val, idx }))
    .filter(({ val }) => val > ucl || val < lcl)
    .map(({ idx }) => idx);
}