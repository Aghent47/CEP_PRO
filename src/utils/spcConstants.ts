// Constantes para gráficos de control (n = 2 a 25)
export interface SPCConstants {
  n: number;      // Tamaño de subgrupo
  A2: number;     // Constante para gráfico X-bar
  D3: number;     // Constante para límite inferior de R
  D4: number;     // Constante para límite superior de R
  d2: number;     // Constante para estimar sigma
}

export const SPC_CONSTANTS: SPCConstants[] = [
  { n: 2, A2: 1.880, D3: 0, D4: 3.267, d2: 1.128 },
  { n: 3, A2: 1.023, D3: 0, D4: 2.574, d2: 1.693 },
  { n: 4, A2: 0.729, D3: 0, D4: 2.282, d2: 2.059 },
  { n: 5, A2: 0.577, D3: 0, D4: 2.114, d2: 2.326 },
  { n: 6, A2: 0.483, D3: 0, D4: 2.004, d2: 2.534 },
  { n: 7, A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704 },
  { n: 8, A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847 },
  { n: 9, A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.970 },
  { n: 10, A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078 },
  { n: 11, A2: 0.285, D3: 0.256, D4: 1.744, d2: 3.173 },
  { n: 12, A2: 0.266, D3: 0.283, D4: 1.717, d2: 3.258 },
  { n: 13, A2: 0.249, D3: 0.307, D4: 1.693, d2: 3.336 },
  { n: 14, A2: 0.235, D3: 0.328, D4: 1.672, d2: 3.407 },
  { n: 15, A2: 0.223, D3: 0.347, D4: 1.653, d2: 3.472 },
  { n: 16, A2: 0.212, D3: 0.363, D4: 1.637, d2: 3.532 },
  { n: 17, A2: 0.203, D3: 0.378, D4: 1.622, d2: 3.588 },
  { n: 18, A2: 0.194, D3: 0.391, D4: 1.608, d2: 3.640 },
  { n: 19, A2: 0.187, D3: 0.403, D4: 1.597, d2: 3.689 },
  { n: 20, A2: 0.180, D3: 0.415, D4: 1.585, d2: 3.735 },
  { n: 21, A2: 0.173, D3: 0.425, D4: 1.575, d2: 3.778 },
  { n: 22, A2: 0.167, D3: 0.434, D4: 1.566, d2: 3.819 },
  { n: 23, A2: 0.162, D3: 0.443, D4: 1.557, d2: 3.858 },
  { n: 24, A2: 0.157, D3: 0.451, D4: 1.548, d2: 3.895 },
  { n: 25, A2: 0.153, D3: 0.459, D4: 1.541, d2: 3.931 }
];

export function getConstantsForN(n: number): SPCConstants {
  const constant = SPC_CONSTANTS.find(c => c.n === n);
  if (!constant) {
    throw new Error(`No hay constantes disponibles para n=${n}. Usar n entre 2 y 25`);
  }
  return constant;
}