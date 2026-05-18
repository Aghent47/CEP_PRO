import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
  
  h3 {
    margin-bottom: 1rem;
    color: var(--text-primary);
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 450px;
`;

const ChartLegend = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    
    .color-box-line {
      width: 20px;
      height: 3px;
      border-radius: 2px;
    }
    
    .color-box-point {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
  }
`;

interface ControlChartProps {
  title: string;
  values: number[];
  centerLine: number;
  ucl: number;
  lcl: number;
  outOfControlPoints?: number[];
  unit?: string;
}

const ControlChart: React.FC<ControlChartProps> = ({
  title,
  values,
  centerLine,
  ucl,
  lcl,
  outOfControlPoints = [],
  unit = ""
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Función para calcular el rango óptimo del eje Y
  const calculateYAxisRange = (): { min: number; max: number } => {
    // Encontrar el valor mínimo y máximo de los datos
    const minDataValue = Math.min(...values);
    const maxDataValue = Math.max(...values);
    
    // Calcular un margen del 10% entre el límite y los datos
    const margin = (ucl - lcl) * 0.1;
    
    // Si hay puntos fuera de control cerca de los límites, ajustamos
    let yMin = Math.min(lcl, minDataValue) - margin;
    let yMax = Math.max(ucl, maxDataValue) + margin;
    
    // Asegurar que el límite superior no sea menor que LCS + 1 unidad
    // y que el límite inferior no sea mayor que LCI - 1 unidad
    const lclMin = lcl - 1;
    const uclMax = ucl + 1;
    
    yMin = Math.min(yMin, lclMin);
    yMax = Math.max(yMax, uclMax);
    
    // Ajustar para que el LCS y LCI sean visibles con un margen visual adecuado
    const range = yMax - yMin;
    const optimalMargin = range * 0.15;
    
    return {
      min: yMin - optimalMargin * 0.3,
      max: yMax + optimalMargin * 0.5
    };
  };

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);

    const subgroups = values.map((_, idx) => idx + 1);
    
    // Crear serie de puntos fuera de control
    const outOfControlData = subgroups.map((_, idx) => {
      if (outOfControlPoints.includes(idx)) {
        return values[idx];
      }
      return null;
    });

    // Calcular rango óptimo del eje Y
    const yAxisRange = calculateYAxisRange();

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        show: false
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(26, 34, 53, 0.95)',
        borderColor: '#2a3448',
        borderWidth: 1,
        textStyle: {
          color: '#e8edf5',
          fontSize: 12
        },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          const dataPoint = params.find((p: any) => p.seriesName === 'Datos');
          if (!dataPoint) return '';
          return `
            <strong>Subgrupo ${dataPoint.dataIndex + 1}</strong><br/>
            Valor: ${dataPoint.value.toFixed(4)} ${unit}<br/>
            LCS: ${ucl.toFixed(4)} ${unit}<br/>
            LC: ${centerLine.toFixed(4)} ${unit}<br/>
            LCI: ${lcl.toFixed(4)} ${unit}
          `;
        }
      },
      grid: {
        left: '10%',
        right: '8%',
        top: '12%',
        bottom: '10%',
        containLabel: true,
        backgroundColor: 'rgba(26, 34, 53, 0.3)',
        borderWidth: 0
      },
      xAxis: {
        name: 'Número de Subgrupo',
        nameLocation: 'middle',
        nameGap: 35,
        type: 'category',
        data: subgroups,
        axisLabel: {
          color: '#8f9bb3',
          fontSize: 11,
          interval: 'auto',
          rotate: 0
        },
        axisLine: {
          lineStyle: { color: '#2a3448' }
        },
        axisTick: { show: false }
      },
      yAxis: {
        name: title.includes('X-bar') ? 'Media del Subgrupo' : 'Rango del Subgrupo',
        nameLocation: 'middle',
        nameGap: 50,
        type: 'value',
        min: yAxisRange.min,
        max: yAxisRange.max,
        axisLabel: {
          color: '#8f9bb3',
          fontSize: 11,
          formatter: (value: number) => value.toFixed(4)
        },
        axisLine: {
          lineStyle: { color: '#2a3448' }
        },
        splitLine: {
          lineStyle: { color: '#1a2235', type: 'dashed' }
        }
      },
      series: [
        {
          name: 'Datos',
          type: 'line',
          data: values,
          smooth: false,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#3b82f6',
            width: 2,
            type: 'solid'
          },
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#0a0e1a',
            borderWidth: 2
          },
          connectNulls: false,
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.05)'
          },
          emphasis: {
            focus: 'series',
            lineStyle: {
              width: 3
            }
          }
        },
        {
          name: 'Puntos Fuera de Control',
          type: 'scatter',
          data: outOfControlData,
          symbol: 'circle',
          symbolSize: 14,
          itemStyle: {
            color: '#ef4444',
            borderColor: '#0a0e1a',
            borderWidth: 2
          },
          tooltip: {
            formatter: (params: any) => {
              return `
                <strong>⚠️ PUNTO FUERA DE CONTROL</strong><br/>
                Subgrupo ${params.dataIndex + 1}<br/>
                Valor: ${params.value.toFixed(4)} ${unit}<br/>
                LCS: ${ucl.toFixed(4)} ${unit}<br/>
                LCI: ${lcl.toFixed(4)} ${unit}
              `;
            }
          }
        },
        {
          name: 'Límite Superior (LCS)',
          type: 'line',
          data: Array(values.length).fill(ucl),
          lineStyle: {
            color: '#ef4444',
            width: 2.5,
            type: 'dashed'
          },
          symbol: 'none',
          smooth: false
        },
        {
          name: 'Límite Inferior (LCI)',
          type: 'line',
          data: Array(values.length).fill(lcl),
          lineStyle: {
            color: '#ef4444',
            width: 2.5,
            type: 'dashed'
          },
          symbol: 'none'
        },
        {
          name: 'Línea Central (LC)',
          type: 'line',
          data: Array(values.length).fill(centerLine),
          lineStyle: {
            color: '#10b981',
            width: 2.5,
            type: 'solid'
          },
          symbol: 'none'
        }
      ],
      legend: {
        data: ['Datos', 'Puntos Fuera de Control', 'Límite Superior (LCS)', 'Límite Inferior (LCI)', 'Línea Central (LC)'],
        orient: 'horizontal',
        left: 'left',
        top: 0,
        textStyle: {
          color: '#8f9bb3',
          fontSize: 11
        },
        itemWidth: 25,
        itemHeight: 12,
        formatter: (name: string) => {
          const legendMap: Record<string, string> = {
            'Datos': '📊 Datos',
            'Puntos Fuera de Control': '⚠️ Fuera de Control',
            'Límite Superior (LCS)': '📈 LCS (3σ)',
            'Límite Inferior (LCI)': '📉 LCI (3σ)',
            'Línea Central (LC)': '⚫ LC (Media)'
          };
          return legendMap[name] || name;
        }
      },
      toolbox: {
        feature: {
          saveAsImage: { 
            title: 'Guardar como imagen',
            name: `grafico_control_${title.replace(/\s/g, '_')}`
          },
          zoom: { 
            title: { 
              zoom: 'Zoom',
              back: 'Restablecer zoom'
            }
          },
          restore: { title: 'Restablecer' }
        },
        iconStyle: {
          borderColor: '#8f9bb3'
        },
        emphasis: {
          iconStyle: {
            borderColor: '#3b82f6'
          }
        }
      }
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [values, centerLine, ucl, lcl, outOfControlPoints, title, unit]);

  return (
    <ChartContainer>
      <h3>{title}</h3>
      <ChartWrapper ref={chartRef} />
      <ChartLegend>
        <div className="legend-item">
          <div className="color-box-line" style={{ background: '#3b82f6' }}></div>
          <span>Datos del proceso</span>
        </div>
        <div className="legend-item">
          <div className="color-box-point" style={{ background: '#ef4444' }}></div>
          <span>Punto fuera de control</span>
        </div>
        <div className="legend-item">
          <div className="color-box-line" style={{ background: '#ef4444', height: '3px' }}></div>
          <span>Límites de control (3σ)</span>
        </div>
        <div className="legend-item">
          <div className="color-box-line" style={{ background: '#10b981' }}></div>
          <span>Línea central</span>
        </div>
      </ChartLegend>
    </ChartContainer>
  );
};

export default ControlChart;