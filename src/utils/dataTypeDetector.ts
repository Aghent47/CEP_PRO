type CellValue = string | number | boolean | null | undefined;

export type DataType = 'variables' | 'attributes';

export interface DetectionResult {
  type: DataType;
  confidence: number;
  reason: string;
}

export function detectDataType(rawData: CellValue[][]): DetectionResult {
  if (!rawData || rawData.length < 2) {
    return { type: 'variables', confidence: 0, reason: 'Datos insuficientes' };
  }

  const headers = rawData[0];
  const dataRows = rawData.slice(1).filter(row => row && row.length > 0);
  
  // Verificar si tiene exactamente 3 columnas (formato de atributos)
  if (headers.length === 3) {
    // Verificar que las columnas 2 y 3 contienen enteros (tamaño de muestra y defectos)
    let sampleCount = 0;
    
    for (const row of dataRows) {
      if (row.length >= 3) {
        const sampleSize = row[1];
        const defects = row[2];
        
        // Verificar que sean números enteros
        const sampleNum = typeof sampleSize === 'number' ? sampleSize : Number(sampleSize);
        const defectsNum = typeof defects === 'number' ? defects : Number(defects);
        
        if (!isNaN(sampleNum) && !isNaN(defectsNum)) {
          if (Number.isInteger(sampleNum) && Number.isInteger(defectsNum)) {
            sampleCount++;
          }
        }
      }
    }
    
    // Si más del 80% de las filas tienen formato entero, es atributos
    if (sampleCount > dataRows.length * 0.8) {
      return { 
        type: 'attributes', 
        confidence: 0.9, 
        reason: 'Detección automática: Formato de atributos (unidades inspeccionadas y defectos)' 
      };
    }
  }
  
  // Verificar si tiene más de 3 columnas (formato de variables)
  if (headers.length > 3) {
    // Verificar que las columnas adicionales contienen números
    let numericCount = 0;
    
    for (const row of dataRows) {
      for (let i = 1; i < Math.min(headers.length, row.length); i++) {
        const value = row[i];
        const num = typeof value === 'number' ? value : Number(value);
        if (!isNaN(num)) {
          numericCount++;
        }
      }
    }
    
    if (numericCount > 0) {
      return { 
        type: 'variables', 
        confidence: 0.95, 
        reason: 'Detección automática: Formato de variables (múltiples mediciones por subgrupo)' 
      };
    }
  }
  
  // Por defecto, asumir variables
  return { 
    type: 'variables', 
    confidence: 0.5, 
    reason: 'Formato no determinado. Usando variables por defecto.' 
  };
}