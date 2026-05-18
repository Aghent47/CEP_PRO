export interface ProcessedData {
  columnNames: string[];
  numericData: number[][]; // Datos por columna (cada columna es un subgrupo o variable)
  rawData: any[][]; // Datos originales para debugging
}

export interface UploadState {
  isLoading: boolean;
  error: string | null;
  data: ProcessedData | null;
  fileName: string | null;
}