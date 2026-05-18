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
  height: 400px;
`;

interface ControlChartProps {
  title: string;
  values: number[];
  centerLine: number;
  ucl: number;
  lcl: number;
  outOfControlPoints?: number[];
}

const ControlChart: React.FC<ControlChartProps> = ({
  title,
  values,
  centerLine,
  ucl,
  lcl,
  outOfControlPoints = []
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

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
        }
      },
      grid: {
        left: '8%',
        right: '8%',
        top: '15%',
        bottom: '8%',
        containLabel: true,
        backgroundColor: 'rgba(26, 34, 53, 0.5)'
      },
      xAxis: {
        name: 'Subgrupo',
        nameLocation: 'middle',
        nameGap: 30,
        type: 'category',
        data: subgroups,
        axisLabel: {
          color: '#8f9bb3',
          fontSize: 11
        },
        axisLine: {
          lineStyle: { color: '#2a3448' }
        },
        axisTick: { show: false }
      },
      yAxis: {
        name: title.includes('X') || title.includes('X̄') ? 'Media del subgrupo' : 'Rango del subgrupo',
        nameLocation: 'middle',
        nameGap: 45,
        type: 'value',
        axisLabel: {
          color: '#8f9bb3',
          fontSize: 11
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
          name: 'Puntos',
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
            color: 'rgba(59, 130, 246, 0.1)'
          }
        },
        {
          name: 'Fuera de control',
          type: 'scatter',
          data: outOfControlData,
          symbol: 'circle',
          symbolSize: 12,
          itemStyle: {
            color: '#ef4444',
            borderColor: '#0a0e1a',
            borderWidth: 2
          }
        },
        {
          name: 'LSC',
          type: 'line',
          data: Array(values.length).fill(ucl),
          lineStyle: {
            color: '#f59e0b',
            width: 1.5,
            type: 'dashed'
          },
          symbol: 'none'
        },
        {
          name: 'LIC',
          type: 'line',
          data: Array(values.length).fill(lcl),
          lineStyle: {
            color: '#f59e0b',
            width: 1.5,
            type: 'dashed'
          },
          symbol: 'none'
        },
        {
          name: 'Línea central',
          type: 'line',
          data: Array(values.length).fill(centerLine),
          lineStyle: {
            color: '#10b981',
            width: 1.5,
            type: 'solid'
          },
          symbol: 'none'
        }
      ],
      legend: {
        data: ['Puntos', 'Fuera de control', 'LSC', 'LIC', 'Línea central'],
        orient: 'horizontal',
        left: 'left',
        top: 0,
        textStyle: {
          color: '#8f9bb3',
          fontSize: 11
        },
        itemWidth: 20,
        itemHeight: 12
      },
      toolbox: {
        feature: {
          saveAsImage: { title: 'Guardar como imagen' },
          zoom: { title: { zoom: 'Zoom', back: 'Restablecer' } }
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
  }, [values, centerLine, ucl, lcl, outOfControlPoints, title]);

  return (
    <ChartContainer>
      <h3>{title}</h3>
      <ChartWrapper ref={chartRef} />
    </ChartContainer>
  );
};

export default ControlChart;