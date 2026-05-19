export interface AttributeData {
  subgroups: number[];      // Números de subgrupo
  sampleSizes: number[];    // Tamaños de muestra (n_i)
  defects: number[];        // Unidades defectuosas o defectos (d_i)
}

export interface AttributeChartData {
  type: 'p' | 'np' | 'c' | 'u';
  values: number[];         // Valores calculados por subgrupo (p_i, np_i, c_i, u_i)
  centerLine: number;       // Línea central (p_barra, np_barra, c_barra, u_barra)
  ucl: number[];            // Límites superiores (pueden variar por subgrupo)
  lcl: number[];            // Límites inferiores (pueden variar por subgrupo)
  sampleSizes: number[];    // Tamaños de muestra originales
  subgroups: number[];      // Números de subgrupo
  warnings: string[];       // Advertencias
}

export interface AttributeValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}