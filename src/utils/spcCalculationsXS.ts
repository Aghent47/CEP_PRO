import { getConstantsForN } from './spcConstants';

export interface SubgroupStatsXS {
  subgroupIndex: number;
  mean: number;
  stdDev: number;
}

export interface XSChartData {
  xbar: {
    values: number[];
    centerLine: number;
    ucl: number;
    lcl: number;
    sigma: number;
  };
  s: {
    values: number[];
    centerLine: number;
    ucl: number;
    lcl: number;
    sigma: number;
  };
  subgroups: SubgroupStatsXS[];
  constants: {
    n: number;
    A3: number;
    B3: number;
    B4: number;
    c4: number;
  };
}

export function calculateSubgroupStatsXS(data: number[][]): SubgroupStatsXS[] {
  return data.map((subgroup, index) => {
    const mean = subgroup.reduce((sum, val) => sum + val, 0) / subgroup.length;
    const variance = subgroup.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (subgroup.length - 1);
    const stdDev = Math.sqrt(variance);
    return {
      subgroupIndex: index + 1,
      mean,
      stdDev
    };
  });
}

export function calculateXSChartData(
  data: number[][],
  subgroupSize: number
): XSChartData {
  if (data.length < 2) {
    throw new Error('Se necesitan al menos 2 subgrupos para el análisis');
  }

  // Validar que todos los subgrupos tengan el tamaño esperado
  for (let i = 0; i < data.length; i++) {
    if (data[i].length !== subgroupSize) {
      throw new Error(`El subgrupo ${i + 1} tiene ${data[i].length} valores, se esperaban ${subgroupSize}`);
    }
  }

  if (subgroupSize < 2 || subgroupSize > 25) {
    throw new Error('El tamaño de subgrupo debe estar entre 2 y 25');
  }

  // Calcular estadísticas por subgrupo
  const subgroups = calculateSubgroupStatsXS(data);
  
  // Calcular gran media (X-doble-barra)
  const grandMean = subgroups.reduce((sum, sg) => sum + sg.mean, 0) / subgroups.length;
  
  // Calcular promedio de desviaciones estándar (s-barra)
  const avgStdDev = subgroups.reduce((sum, sg) => sum + sg.stdDev, 0) / subgroups.length;
  
  // Obtener constantes para el tamaño de subgrupo
  const constants = getConstantsForN(subgroupSize);
  
  // Calcular límites para gráfico X-bar con s
  const xbarUcl = grandMean + constants.A3 * avgStdDev;
  const xbarLcl = grandMean - constants.A3 * avgStdDev;
  
  // Calcular límites para gráfico s
  const sUcl = constants.B4 * avgStdDev;
  const sLcl = constants.B3 * avgStdDev;
  
  // Sigma del proceso estimado con c4
  const processSigma = avgStdDev / constants.c4;
  
  return {
    xbar: {
      values: subgroups.map(sg => sg.mean),
      centerLine: grandMean,
      ucl: xbarUcl,
      lcl: xbarLcl,
      sigma: processSigma / Math.sqrt(subgroupSize)
    },
    s: {
      values: subgroups.map(sg => sg.stdDev),
      centerLine: avgStdDev,
      ucl: sUcl,
      lcl: sLcl,
      sigma: processSigma
    },
    subgroups,
    constants: {
      n: constants.n,
      A3: constants.A3,
      B3: constants.B3,
      B4: constants.B4,
      c4: constants.c4
    }
  };
}