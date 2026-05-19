import { create } from 'zustand';
import type { ProcessedData } from '../types';
import type { XRChartData } from '../utils/spcCalculations';
import type { AttributeChartData } from '../types/attributeTypes';

interface DataStore {
  // Upload state
  isLoading: boolean;
  error: string | null;
  data: ProcessedData | null;
  fileName: string | null;
  
  // Analysis state
  chartData: XRChartData | null;
  attributeChartData: AttributeChartData | null;
  selectedSubgroupSize: number;
  dataType: 'variables' | 'attributes';
  
  // Actions
  setData: (data: ProcessedData, fileName: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setChartData: (chartData: XRChartData | null) => void;
  setAttributeChartData: (chartData: AttributeChartData | null) => void;
  setSelectedSubgroupSize: (size: number) => void;
  setDataType: (type: 'variables' | 'attributes') => void;
  reset: () => void;
}

export const useDataStore = create<DataStore>((set) => ({
  isLoading: false,
  error: null,
  data: null,
  fileName: null,
  chartData: null,
  attributeChartData: null,
  selectedSubgroupSize: 5,
  dataType: 'variables',
  
  setData: (data, fileName) => set({ data, fileName, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setChartData: (chartData) => set({ chartData }),
  setAttributeChartData: (attributeChartData) => set({ attributeChartData }),
  setSelectedSubgroupSize: (selectedSubgroupSize) => set({ selectedSubgroupSize }),
  setDataType: (dataType) => set({ dataType }),
  reset: () => set({ 
    data: null, 
    fileName: null, 
    error: null, 
    isLoading: false,
    chartData: null,
    attributeChartData: null,
    dataType: 'variables'
  })
}));