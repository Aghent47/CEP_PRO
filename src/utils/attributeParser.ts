type CellValue = string | number | boolean | null | undefined;

export interface ParsedAttributeData {
  sampleSizes: number[];
  defects: number[];
  subgroups: number[];
  hasUnitSizes: boolean;
}

export function parseAttributeData(rawData: CellValue[][]): ParsedAttributeData {
  if (!rawData || rawData.length < 2) {
    throw new Error('El archivo debe contener al menos una fila de encabezados y una fila de datos');
  }
  
  // Saltar encabezados
  const rows = rawData.slice(1);
  const sampleSizes: number[] = [];
  const defects: number[] = [];
  const subgroups: number[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;
    
    const subgroupId = row[0];
    const sampleSize = row[1];
    const defect = row[2];
    
    // Validar y convertir
    let subNum: number = i + 1;
    if (subgroupId !== undefined && subgroupId !== "" && subgroupId !== null) {
      const parsed = typeof subgroupId === 'number' ? subgroupId : Number(subgroupId);
      if (!isNaN(parsed)) subNum = parsed;
    }
    
    let sampleNum: number = 0;
    if (typeof sampleSize === 'number') {
      sampleNum = sampleSize;
    } else if (typeof sampleSize === 'string') {
      sampleNum = parseFloat(sampleSize);
    }
    
    let defectNum: number = 0;
    if (typeof defect === 'number') {
      defectNum = defect;
    } else if (typeof defect === 'string') {
      defectNum = parseFloat(defect);
    }
    
    if (isNaN(sampleNum) || sampleNum <= 0) {
      throw new Error(`Fila ${i + 2}: Unidades inspeccionadas inválido (${sampleSize})`);
    }
    
    if (isNaN(defectNum) || defectNum < 0) {
      throw new Error(`Fila ${i + 2}: Unidades defectuosas inválido (${defect})`);
    }
    
    if (defectNum > sampleNum) {
      throw new Error(`Fila ${i + 2}: Defectos (${defectNum}) no puede ser mayor que inspeccionados (${sampleNum})`);
    }
    
    sampleSizes.push(sampleNum);
    defects.push(defectNum);
    subgroups.push(subNum);
  }
  
  if (sampleSizes.length < 2) {
    throw new Error('Se necesitan al menos 2 subgrupos para el análisis');
  }
  
  // Detectar si es gráfico u (tamaños variables en unidad)
  const uniqueSizes = [...new Set(sampleSizes)];
  const hasUnitSizes = uniqueSizes.length > 1;
  
  return {
    sampleSizes,
    defects,
    subgroups,
    hasUnitSizes
  };
}