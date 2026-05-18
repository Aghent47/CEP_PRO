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
  
  // La primera columna es el número de subgrupo, las demás son mediciones
  const measurementColumns: CellValue[] = headers.slice(1); // Saltamos la primera columna (Subgrupo)
  
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
  
  // Organizar datos por subgrupo: cada fila es un subgrupo, cada columna (excepto primera) es una medición
  const subgroups: number[][] = [];
  const subgroupLabels: number[] = [];
  
  for (const row of validRows) {
    // La primera celda es el número de subgrupo (opcional, podemos ignorarlo o usarlo como label)
    const subgroupId: CellValue = row[0];
    
    // Las siguientes celdas son las mediciones
    const measurements: number[] = [];
    
    for (let colIdx = 1; colIdx < row.length && colIdx < headers.length; colIdx++) {
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
    
    if (measurements.length > 0) {
      subgroups.push(measurements);
      if (subgroupId !== undefined && subgroupId !== "" && subgroupId !== null) {
        const numId: number = typeof subgroupId === 'number' ? subgroupId : Number(subgroupId);
        if (!isNaN(numId)) {
          subgroupLabels.push(numId);
        }
      }
    }
  }
  
  if (subgroups.length === 0) {
    reject(new Error('No se encontraron datos numéricos válidos en el archivo'));
    return;
  }
  
  // Crear nombres de columnas para las mediciones
  const columnNames: string[] = measurementColumns.map((col: CellValue, idx: number) => {
    if (col && col !== "") {
      return String(col).trim();
    }
    return `Medición ${idx + 1}`;
  });
  
  // Añadir columna de subgrupo al inicio
  const allColumnNames: string[] = ['Subgrupo', ...columnNames];
  
  // Reconstruir rawData para preview
  const reconstructedRawData: CellValue[][] = [
    allColumnNames,
    ...subgroups.map((subgroup: number[], idx: number) => {
      const row: CellValue[] = [subgroupLabels[idx] || idx + 1, ...subgroup];
      return row;
    })
  ];
  
  resolve({
    columnNames: allColumnNames,
    numericData: subgroups, // Cada subgrupo es un array de mediciones
    rawData: reconstructedRawData
  });
}