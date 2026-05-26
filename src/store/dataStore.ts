import { create } from 'zustand';
import type { ProcessedData } from '../types';
import type { XRChartData } from '../utils/spcCalculations';
import type { XSChartData } from '../utils/spcCalculationsXS';
import type { AttributeChartData } from '../types/attributeTypes';

export type ChartType = 'X-R' | 'X-s' | 'Attributes';

interface DataStore {
  // Upload state
  isLoading: boolean;
  error: string | null;
  data: ProcessedData | null;
  fileName: string | null;
  
  // Analysis state
  chartDataXR: XRChartData | null;
  chartDataXS: XSChartData | null;
  attributeChartData: AttributeChartData | null;
  selectedSubgroupSize: number;
  dataType: 'variables' | 'attributes';
  chartType: ChartType;
  
  // Actions
  setData: (data: ProcessedData, fileName: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setChartDataXR: (chartData: XRChartData | null) => void;
  setChartDataXS: (chartData: XSChartData | null) => void;
  setAttributeChartData: (chartData: AttributeChartData | null) => void;
  setSelectedSubgroupSize: (size: number) => void;
  setDataType: (type: 'variables' | 'attributes') => void;
  setChartType: (type: ChartType) => void;
  reset: () => void;
}

export const useDataStore = create<DataStore>((set) => ({
  isLoading: false,
  error: null,
  data: null,
  fileName: null,
  chartDataXR: null,
  chartDataXS: null,
  attributeChartData: null,
  selectedSubgroupSize: 5,
  dataType: 'variables',
  chartType: 'X-R',
  
  setData: (data, fileName) => set({ data, fileName, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setChartDataXR: (chartDataXR) => set({ chartDataXR }),
  setChartDataXS: (chartDataXS) => set({ chartDataXS }),
  setAttributeChartData: (attributeChartData) => set({ attributeChartData }),
  setSelectedSubgroupSize: (selectedSubgroupSize) => set({ selectedSubgroupSize }),
  setDataType: (dataType) => set({ dataType }),
  setChartType: (chartType) => set({ chartType }),
  reset: () => set({ 
    data: null, 
    fileName: null, 
    error: null, 
    isLoading: false,
    chartDataXR: null,
    chartDataXS: null,
    attributeChartData: null,
    dataType: 'variables',
    chartType: 'X-R'
  })
}));