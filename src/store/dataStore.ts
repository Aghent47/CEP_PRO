import { create } from 'zustand';
import type { ProcessedData } from '../types';
import type { XRChartData } from '../utils/spcCalculations';

interface DataStore {
  // Upload state
  isLoading: boolean;
  error: string | null;
  data: ProcessedData | null;
  fileName: string | null;
  
  // Analysis state
  chartData: XRChartData | null;
  selectedSubgroupSize: number;
  
  // Actions
  setData: (data: ProcessedData, fileName: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setChartData: (chartData: XRChartData | null) => void;
  setSelectedSubgroupSize: (size: number) => void;
  reset: () => void;
}

export const useDataStore = create<DataStore>((set) => ({
  isLoading: false,
  error: null,
  data: null,
  fileName: null,
  chartData: null,
  selectedSubgroupSize: 5,
  
  setData: (data, fileName) => set({ data, fileName, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setChartData: (chartData) => set({ chartData }),
  setSelectedSubgroupSize: (selectedSubgroupSize) => set({ selectedSubgroupSize }),
  reset: () => set({ 
    data: null, 
    fileName: null, 
    error: null, 
    isLoading: false,
    chartData: null
  })
}));