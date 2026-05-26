// Constantes para gráficos de control (n = 2 a 25)
export interface SPCConstants {
  n: number;      // Tamaño de subgrupo
  A2: number;     // Constante para gráfico X-bar (X-R)
  D3: number;     // Constante para límite inferior de R
  D4: number;     // Constante para límite superior de R
  d2: number;     // Constante para estimar sigma (X-R)
  // Constantes para gráfico X-s
  A3: number;     // Constante para gráfico X-bar con s
  B3: number;     // Constante para límite inferior de s
  B4: number;     // Constante para límite superior de s
  c4: number;     // Constante para estimar sigma con s
}

export const SPC_CONSTANTS: SPCConstants[] = [
  { n: 2, A2: 1.880, D3: 0, D4: 3.267, d2: 1.128, A3: 2.659, B3: 0, B4: 3.267, c4: 0.7979 },
  { n: 3, A2: 1.023, D3: 0, D4: 2.574, d2: 1.693, A3: 1.954, B3: 0, B4: 2.568, c4: 0.8862 },
  { n: 4, A2: 0.729, D3: 0, D4: 2.282, d2: 2.059, A3: 1.628, B3: 0, B4: 2.266, c4: 0.9213 },
  { n: 5, A2: 0.577, D3: 0, D4: 2.114, d2: 2.326, A3: 1.427, B3: 0, B4: 2.089, c4: 0.9400 },
  { n: 6, A2: 0.483, D3: 0, D4: 2.004, d2: 2.534, A3: 1.287, B3: 0.030, B4: 1.970, c4: 0.9515 },
  { n: 7, A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704, A3: 1.182, B3: 0.118, B4: 1.882, c4: 0.9594 },
  { n: 8, A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847, A3: 1.099, B3: 0.185, B4: 1.815, c4: 0.9650 },
  { n: 9, A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.970, A3: 1.032, B3: 0.239, B4: 1.761, c4: 0.9693 },
  { n: 10, A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078, A3: 0.975, B3: 0.284, B4: 1.716, c4: 0.9727 },
  { n: 11, A2: 0.285, D3: 0.256, D4: 1.744, d2: 3.173, A3: 0.927, B3: 0.321, B4: 1.679, c4: 0.9754 },
  { n: 12, A2: 0.266, D3: 0.283, D4: 1.717, d2: 3.258, A3: 0.886, B3: 0.354, B4: 1.646, c4: 0.9776 },
  { n: 13, A2: 0.249, D3: 0.307, D4: 1.693, d2: 3.336, A3: 0.850, B3: 0.382, B4: 1.618, c4: 0.9794 },
  { n: 14, A2: 0.235, D3: 0.328, D4: 1.672, d2: 3.407, A3: 0.817, B3: 0.406, B4: 1.594, c4: 0.9810 },
  { n: 15, A2: 0.223, D3: 0.347, D4: 1.653, d2: 3.472, A3: 0.789, B3: 0.428, B4: 1.572, c4: 0.9823 },
  { n: 16, A2: 0.212, D3: 0.363, D4: 1.637, d2: 3.532, A3: 0.763, B3: 0.448, B4: 1.552, c4: 0.9835 },
  { n: 17, A2: 0.203, D3: 0.378, D4: 1.622, d2: 3.588, A3: 0.739, B3: 0.466, B4: 1.534, c4: 0.9845 },
  { n: 18, A2: 0.194, D3: 0.391, D4: 1.608, d2: 3.640, A3: 0.718, B3: 0.482, B4: 1.518, c4: 0.9854 },
  { n: 19, A2: 0.187, D3: 0.403, D4: 1.597, d2: 3.689, A3: 0.698, B3: 0.497, B4: 1.503, c4: 0.9862 },
  { n: 20, A2: 0.180, D3: 0.415, D4: 1.585, d2: 3.735, A3: 0.680, B3: 0.510, B4: 1.490, c4: 0.9869 },
  { n: 21, A2: 0.173, D3: 0.425, D4: 1.575, d2: 3.778, A3: 0.663, B3: 0.523, B4: 1.477, c4: 0.9876 },
  { n: 22, A2: 0.167, D3: 0.434, D4: 1.566, d2: 3.819, A3: 0.647, B3: 0.534, B4: 1.466, c4: 0.9882 },
  { n: 23, A2: 0.162, D3: 0.443, D4: 1.557, d2: 3.858, A3: 0.633, B3: 0.545, B4: 1.455, c4: 0.9887 },
  { n: 24, A2: 0.157, D3: 0.451, D4: 1.548, d2: 3.895, A3: 0.619, B3: 0.555, B4: 1.445, c4: 0.9892 },
  { n: 25, A2: 0.153, D3: 0.459, D4: 1.541, d2: 3.931, A3: 0.606, B3: 0.565, B4: 1.435, c4: 0.9896 }
];

export function getConstantsForN(n: number): SPCConstants {
  const constant = SPC_CONSTANTS.find(c => c.n === n);
  if (!constant) {
    throw new Error(`No hay constantes disponibles para n=${n}. Usar n entre 2 y 25`);
  }
  return constant;
}

export function getRecommendedChartType(n: number): 'X-R' | 'X-s' {
  if (n <= 9) {
    return 'X-R';
  }
  return 'X-s';
}