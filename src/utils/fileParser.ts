import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { ProcessedData } from '../types';

type CellValue = string | number | boolean | null | undefined;

export const parseExcelOrCSV = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        let data: CellValue[][] = [];
        
        if (extension === 'csv') {
          const csvText = e.target?.result as string;
          Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<CellValue[]>) => {
              data = results.data as CellValue[][];
              processData(data, resolve, reject);
            },
            error: (error: Error) => {
              reject(new Error(`Error al parsear CSV: ${error.message}`));
            }
          });
        } else if (extension === 'xlsx' || extension === 'xls') {
          const binaryStr = e.target?.result as string;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" }) as CellValue[][];
          processData(data, resolve, reject);
        } else {
          reject(new Error('Formato no soportado. Use .xlsx, .xls o .csv'));
          return;
        }
      } catch (error: unknown) {
        reject(new Error(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Desconocido'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    
    if (extension === 'csv') {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsBinaryString(file);
    }
  });
};

function processData(
  data: CellValue[][],
  resolve: (value: ProcessedData) => void,
  reject: (reason: Error) => void
): void {
  if (!data || data.length < 2) {
    reject(new Error('El archivo debe contener al menos una fila de encabezados y una fila de datos'));
    return;
  }

  // La primera fila son los encabezados
  const headers: CellValue[] = data[0];
  
  // Extraer datos a partir de la fila 1 (índice 1)
  const rawRows: CellValue[][] = data.slice(1);
  
  // Filtrar filas vacías
  const validRows: CellValue[][] = rawRows.filter((row: CellValue[]) => {
    return row.length > 0 && row.some((cell: CellValue) => cell !== "" && cell !== undefined && cell !== null);
  });
  
  if (validRows.length === 0) {
    reject(new Error('No se encontraron filas con datos válidos'));
    return;
  }
  
  // Determinar cuántas columnas de mediciones tienen datos
  // Para cada columna (desde la columna 1 en adelante), verificar si tiene al menos un valor numérico
  const maxColumns = Math.max(...validRows.map((row: CellValue[]) => row.length));
  const columnsWithData: number[] = [];
  
  // Analizar columna por columna (empezando desde la columna 1, que es la primera medición)
  for (let colIdx = 1; colIdx < maxColumns; colIdx++) {
    let hasData = false;
    
    for (const row of validRows) {
      const cellValue = row[colIdx];
      if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
        // Verificar si es un número válido
        if (typeof cellValue === 'number') {
          hasData = true;
          break;
        } else if (typeof cellValue === 'string') {
          const cleanString = cellValue.trim().replace(',', '.');
          const parsedNum = parseFloat(cleanString);
          if (!isNaN(parsedNum)) {
            hasData = true;
            break;
          }
        } else if (typeof cellValue === 'boolean') {
          hasData = true;
          break;
        }
      }
    }
    
    if (hasData) {
      columnsWithData.push(colIdx);
    }
  }
  
  // Si no se detectaron columnas con datos, usar al menos la primera columna de medición
  const measurementColumns = columnsWithData.length > 0 ? columnsWithData : [1];
  
  // Organizar datos por subgrupo
  const subgroups: number[][] = [];
  const subgroupLabels: number[] = [];
  
  for (const row of validRows) {
    // La primera celda es el número de subgrupo
    const subgroupId: CellValue = row[0];
    
    // Solo extraer las columnas que tienen datos
    const measurements: number[] = [];
    
    for (const colIdx of measurementColumns) {
      if (colIdx < row.length) {
        const cellValue: CellValue = row[colIdx];
        let numValue: number | null = null;
        
        if (typeof cellValue === 'number') {
          numValue = cellValue;
        } else if (typeof cellValue === 'string') {
          const cleanString: string = cellValue.trim().replace(',', '.');
          const parsedNum: number = parseFloat(cleanString);
          if (!isNaN(parsedNum)) {
            numValue = parsedNum;
          }
        } else if (typeof cellValue === 'boolean') {
          numValue = cellValue ? 1 : 0;
        }
        
        if (numValue !== null && !isNaN(numValue)) {
          measurements.push(numValue);
        }
      }
    }
    
    if (measurements.length > 0) {
      subgroups.push(measurements);
      if (subgroupId !== undefined && subgroupId !== "" && subgroupId !== null) {
        const numId: number = typeof subgroupId === 'number' ? subgroupId : Number(subgroupId);
        if (!isNaN(numId)) {
          subgroupLabels.push(numId);
        } else {
          subgroupLabels.push(subgroups.length);
        }
      } else {
        subgroupLabels.push(subgroups.length);
      }
    }
  }
  
  if (subgroups.length === 0) {
    reject(new Error('No se encontraron datos numéricos válidos en el archivo'));
    return;
  }
  
  // Validar que todos los subgrupos tengan el mismo número de mediciones
  const subgroupSizes = subgroups.map(sg => sg.length);
  const uniqueSizes = [...new Set(subgroupSizes)];
  
  if (uniqueSizes.length > 1) {
    reject(new Error(`Los subgrupos tienen diferente número de mediciones: ${uniqueSizes.join(', ')}. Verifica que todas las filas tengan los mismos datos.`));
    return;
  }
  
  // Crear nombres de columnas basados en las columnas que tienen datos
  const measurementCount = measurementColumns.length;
  const columnNames: string[] = [];
  
  // Usar los encabezados originales si existen y son válidos
  for (let i = 0; i < measurementCount; i++) {
    const colIdx = measurementColumns[i];
    if (headers && headers[colIdx] && headers[colIdx] !== "") {
      columnNames.push(String(headers[colIdx]).trim());
    } else {
      columnNames.push(`Medición ${i + 1}`);
    }
  }
  
  // Añadir columna de subgrupo al inicio
  const allColumnNames: string[] = ['Subgrupo', ...columnNames];
  
  // Reconstruir rawData para preview (solo las columnas con datos)
  const reconstructedRawData: CellValue[][] = [
    allColumnNames,
    ...subgroups.map((subgroup: number[], idx: number) => {
      const row: CellValue[] = [subgroupLabels[idx], ...subgroup];
      return row;
    })
  ];
  
  resolve({
    columnNames: allColumnNames,
    numericData: subgroups,
    rawData: reconstructedRawData
  });
}