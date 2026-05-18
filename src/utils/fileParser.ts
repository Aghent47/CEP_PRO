import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { ProcessedData } from '../types';

export const parseExcelOrCSV = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let data: (string | number | boolean | null | undefined)[][] = [];
        
        if (extension === 'csv') {
          const csvText = e.target?.result as string;
          const parsed = Papa.parse(csvText, { header: false, skipEmptyLines: true });
          data = parsed.data as (string | number | boolean | null | undefined)[][];
        } else if (extension === 'xlsx' || extension === 'xls') {
          const binaryStr = e.target?.result as string;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
        } else {
          reject(new Error('Formato no soportado. Use .xlsx, .xls o .csv'));
          return;
        }

        if (!data || data.length < 2) {
          reject(new Error('El archivo debe contener al menos una fila de encabezados y una fila de datos'));
          return;
        }

        // Extraer encabezados (primera fila)
        const columnNames: string[] = data[0].map((header: string | number | boolean | null | undefined) => String(header).trim());
        
        // Extraer datos numéricos (de la fila 1 en adelante)
        const rawRows = data.slice(1);
        const numericData: number[][] = columnNames.map(() => []);
        
        for (const row of rawRows) {
          if (row.length === 0 || row.every(cell => cell === "" || cell === undefined || cell === null)) continue;
          
          for (let colIdx = 0; colIdx < columnNames.length; colIdx++) {
            const cellValue = row[colIdx];
            let numValue: number | null = null;
            
            if (typeof cellValue === 'number') {
              numValue = cellValue;
            } else if (typeof cellValue === 'string') {
              const cleanString = cellValue.trim().replace(',', '.');
              const parsedNum = parseFloat(cleanString);
              if (!isNaN(parsedNum)) {
                numValue = parsedNum;
              }
            } else if (typeof cellValue === 'boolean') {
              numValue = cellValue ? 1 : 0;
            }
            
            if (numValue !== null && !isNaN(numValue)) {
              numericData[colIdx].push(numValue);
            }
          }
        }
        
        // Validar que hay datos numéricos
        const hasData = numericData.some(col => col.length > 0);
        if (!hasData) {
          reject(new Error('No se encontraron datos numéricos válidos en el archivo'));
          return;
        }
        
        resolve({
          columnNames,
          numericData,
          rawData: data
        });
        
      } catch (error) {
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