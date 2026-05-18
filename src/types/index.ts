export interface ProcessedData {
  columnNames: string[];
  numericData: number[][];
  rawData: (string | number | boolean | null | undefined)[][];
}

export interface UploadState {
  isLoading: boolean;
  error: string | null;
  data: ProcessedData | null;
  fileName: string | null;
}