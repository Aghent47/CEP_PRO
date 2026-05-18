import { create } from 'zustand';
import type { ProcessedData, UploadState } from '../types';

interface DataStore extends UploadState {
  setData: (data: ProcessedData, fileName: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDataStore = create<DataStore>((set) => ({
  isLoading: false,
  error: null,
  data: null,
  fileName: null,
  
  setData: (data: ProcessedData, fileName: string) => set({ data, fileName, isLoading: false, error: null }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error, isLoading: false }),
  reset: () => set({ data: null, fileName: null, error: null, isLoading: false })
}));