import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
`;

const Title = styled.h4`
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 450px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
`;

const StatBadge = styled.div<{ color: string }>`
  background: ${props => `${props.color}15`};
  border-left: 3px solid ${props => props.color};
  padding: 0.5rem;
  border-radius: 8px;
  
  .label {
    font-size: 0.65rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
  }
  
  .value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }
`;

interface ProcessHistogramProps {
  data: number[];
  mean: number;
  sigma: number;
  lie: number | null;
  lse: number | null;
  target?: number | null;
  unit: string;
  title?: string;
}

const ProcessHistogramECharts: React.FC<ProcessHistogramProps> = ({
  data,
  mean,
  sigma,
  lie,
  lse,
  target,
  unit,
  title = "Distribución del Proceso vs Especificaciones"
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  if (!data || data.length === 0) return null;
  if (!sigma || sigma <= 0) return null;

  // ============ 1. CALCULAR HISTOGRAMA ============
  const numBins = Math.min(15, Math.max(8, Math.ceil(Math.sqrt(data.length))));
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const binWidth = (maxVal - minVal) / numBins;

  const binCenters: number[] = [];
  const frequencies: number[] = [];

  for (let i = 0; i < numBins; i++) {
    const binStart = minVal + i * binWidth;
    const binEnd = binStart + binWidth;
    const binCenter = (binStart + binEnd) / 2;
    binCenters.push(binCenter);
    const count = data.filter(v => v >= binStart && v < binEnd).length;
    frequencies.push(count);
  }

  const maxFreq = Math.max(...frequencies);
  const totalData = data.length;

  // ============ 2. GENERAR CURVA NORMAL ============
  const normalPDF = (x: number, mu: number, sig: number): number => {
    const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sig, 2));
    return (1 / (sig * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  };

  // Generar curva continua (más puntos para suavidad)
  const curveStart = mean - 4 * sigma;
  const curveEnd = mean + 4 * sigma;
  const curveStep = (curveEnd - curveStart) / 200;
  
  const curveX: number[] = [];
  const curveYDensity: number[] = [];
  
  for (let x = curveStart; x <= curveEnd; x += curveStep) {
    curveX.push(x);
    curveYDensity.push(normalPDF(x, mean, sigma));
  }
  
  const maxDensity = Math.max(...curveYDensity);
  
  // Escalar curva para que sea visible (70% de la altura máxima del histograma)
  const scaleFactor = maxFreq / maxDensity * 0.7;
  const curveY = curveYDensity.map(y => y * scaleFactor);
  
  // ============ 3. LÍMITES DEL GRÁFICO ============
  let xAxisMin = Math.min(curveStart, minVal - binWidth);
  let xAxisMax = Math.max(curveEnd, maxVal + binWidth);
  
  // Añadir margen adicional
  const xRange = xAxisMax - xAxisMin;
  xAxisMin = xAxisMin - xRange * 0.05;
  xAxisMax = xAxisMax + xRange * 0.05;
  
  if (lie !== null && lie < xAxisMin) xAxisMin = lie - sigma;
  if (lse !== null && lse > xAxisMax) xAxisMax = lse + sigma;
  
  // Forzar un rango mínimo para que la curva sea visible
  const finalRange = xAxisMax - xAxisMin;
  if (finalRange < 0.5) {
    const center = (xAxisMin + xAxisMax) / 2;
    xAxisMin = center - 0.6;
    xAxisMax = center + 0.6;
  }
  
  const yAxisMax = Math.max(maxFreq, Math.max(...curveY)) * 1.15;

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);

    const series: any[] = [
      {
        name: 'Histograma',
        type: 'bar',
        data: frequencies,
        barWidth: '85%',
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [4, 4, 0, 0],
          opacity: 0.7
        },
        label: { show: false },
        tooltip: {
          formatter: (params: any) => {
            const binCenter = binCenters[params.dataIndex];
            const percentage = ((params.value / totalData) * 100).toFixed(1);
            return `<strong>📊 Histograma</strong><br/>Centro: ${binCenter.toFixed(3)} ${unit}<br/>Frecuencia: ${params.value} (${percentage}%)`;
          }
        }
      },
      {
        name: 'Curva Normal',
        type: 'line',
        data: curveY,
        smooth: true,
        lineStyle: {
          color: '#ef4444',
          width: 3,
          type: 'solid'
        },
        symbol: 'none',
        areaStyle: {
          color: 'rgba(239, 68, 68, 0.15)'
        },
        tooltip: {
          formatter: (params: any) => {
            const xValue = curveX[params.dataIndex];
            return `<strong>📈 Curva Normal</strong><br/>Valor: ${xValue.toFixed(3)} ${unit}`;
          }
        }
      },
      {
        name: 'Media',
        type: 'line',
        data: [],
        markLine: {
          data: [{ xAxis: mean }],
          lineStyle: {
            color: '#3b82f6',
            width: 2.5,
            type: 'solid'
          },
          label: {
            formatter: `Media: ${mean.toFixed(3)} ${unit}`,
            color: '#3b82f6',
            position: 'middle',
            fontWeight: 'bold'
          },
          symbol: 'none'
        }
      }
    ];

    if (lie !== null) {
      series.push({
        name: 'LIE',
        type: 'line',
        data: [],
        markLine: {
          data: [{ xAxis: lie }],
          lineStyle: {
            color: '#10b981',
            width: 2.5,
            type: 'dashed'
          },
          label: {
            formatter: `LIE: ${lie} ${unit}`,
            color: '#10b981',
            position: 'start',
            fontWeight: 'bold'
          },
          symbol: 'none'
        }
      });
    }

    if (lse !== null) {
      series.push({
        name: 'LSE',
        type: 'line',
        data: [],
        markLine: {
          data: [{ xAxis: lse }],
          lineStyle: {
            color: '#10b981',
            width: 2.5,
            type: 'dashed'
          },
          label: {
            formatter: `LSE: ${lse} ${unit}`,
            color: '#10b981',
            position: 'end',
            fontWeight: 'bold'
          },
          symbol: 'none'
        }
      });
    }

    if (target !== null && target !== undefined) {
      series.push({
        name: 'Nominal',
        type: 'line',
        data: [],
        markLine: {
          data: [{ xAxis: target }],
          lineStyle: {
            color: '#8b5cf6',
            width: 2,
            type: 'dotted'
          },
          label: {
            formatter: `Nominal: ${target} ${unit}`,
            color: '#8b5cf6',
            position: 'middle'
          },
          symbol: 'none'
        }
      });
    }

    if (lie !== null) {
      series.push({
        name: 'Zona Fuera LIE',
        type: 'line',
        data: [],
        markArea: {
          data: [[{ xAxis: xAxisMin }, { xAxis: lie }]],
          itemStyle: { color: 'rgba(239, 68, 68, 0.2)' },
          label: { show: false }
        }
      });
    }

    if (lse !== null) {
      series.push({
        name: 'Zona Fuera LSE',
        type: 'line',
        data: [],
        markArea: {
          data: [[{ xAxis: lse }, { xAxis: xAxisMax }]],
          itemStyle: { color: 'rgba(239, 68, 68, 0.2)' },
          label: { show: false }
        }
      });
    }

    const legendData = ['Histograma', 'Curva Normal', 'Media'];
    if (lie !== null) legendData.push('LIE');
    if (lse !== null) legendData.push('LSE');
    if (target !== null && target !== undefined) legendData.push('Nominal');

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: { show: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(26, 34, 53, 0.95)',
        borderColor: '#2a3448',
        borderWidth: 1,
        textStyle: { color: '#e8edf5', fontSize: 12 }
      },
      grid: {
        left: '8%',
        right: '8%',
        top: '15%',
        bottom: '10%',
        containLabel: true,
        backgroundColor: 'rgba(26, 34, 53, 0.2)'
      },
      xAxis: {
        name: `Valor (${unit})`,
        type: 'value',
        min: xAxisMin,
        max: xAxisMax,
        axisLabel: {
          color: '#8f9bb3',
          fontSize: 11,
          formatter: (value: number) => value.toFixed(3)
        },
        axisLine: { lineStyle: { color: '#2a3448' } },
        splitLine: { show: false }
      },
      yAxis: {
        name: 'Frecuencia',
        type: 'value',
        min: 0,
        max: yAxisMax,
        axisLabel: { color: '#8f9bb3', fontSize: 11 },
        axisLine: { lineStyle: { color: '#2a3448' } },
        splitLine: { lineStyle: { color: '#1a2235', type: 'dashed' } }
      },
      dataZoom: [
        {
          type: 'slider',
          start: 0,
          end: 100,
          bottom: 10,
          height: 20,
          handleSize: 16,
          brushSelect: true,
          labelPrecision: 3
        },
        {
          type: 'inside',
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true
        }
      ],
      series: series,
      legend: {
        data: legendData,
        orient: 'horizontal',
        left: 'left',
        top: 0,
        textStyle: { color: '#8f9bb3', fontSize: 11 },
        itemWidth: 25,
        itemHeight: 12
      },
      toolbox: {
        feature: {
          saveAsImage: { 
            title: 'Guardar como imagen',
            name: 'histograma_distribucion'
          },
          zoom: { 
            title: { 
              zoom: 'Zoom (arrastra para ampliar)',
              back: 'Restablecer zoom'
            }
          },
          restore: { title: 'Restablecer todo' },
          dataZoom: { title: { zoom: 'Zoom con selector' } }
        },
        iconStyle: { borderColor: '#8f9bb3' }
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
  }, [data, mean, sigma, lie, lse, target, unit, binCenters, frequencies, curveY, curveX, xAxisMin, xAxisMax, yAxisMax, totalData]);

  const withinSpec = data.filter(v => {
    if (lie !== null && v < lie) return false;
    if (lse !== null && v > lse) return false;
    return true;
  }).length;

  const belowLIE = lie !== null ? data.filter(v => v < lie).length : 0;
  const aboveLSE = lse !== null ? data.filter(v => v > lse).length : 0;
  
  const toleranceUsage = (lie !== null && lse !== null) 
    ? ((6 * sigma) / (lse - lie)) * 100 
    : 0;

  return (
    <ChartContainer>
      <Title>📊 {title}</Title>
      <ChartWrapper ref={chartRef} />
      
      {lie !== null && lse !== null && (
        <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px', 
            height: '8px', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              width: `${Math.min(toleranceUsage, 100)}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              borderRadius: '8px'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
            <span>📏 Consume {toleranceUsage.toFixed(1)}% de tolerancia</span>
            <span>{toleranceUsage > 80 ? '⚠️ Alto' : toleranceUsage > 60 ? '⚠️ Moderado' : '✓ Aceptable'}</span>
          </div>
        </div>
      )}
      
      <StatsGrid>
        <StatBadge color="#3b82f6">
          <div className="label">Media del Proceso</div>
          <div className="value">{mean.toFixed(3)} {unit}</div>
        </StatBadge>
        <StatBadge color="#ef4444">
          <div className="label">Sigma del Proceso</div>
          <div className="value">{sigma.toFixed(4)} {unit}</div>
        </StatBadge>
        {target !== null && target !== undefined && (
          <StatBadge color="#8b5cf6">
            <div className="label">Valor Nominal</div>
            <div className="value">{target} {unit}</div>
          </StatBadge>
        )}
        {lie !== null && (
          <StatBadge color="#10b981">
            <div className="label">LIE</div>
            <div className="value">{lie} {unit}</div>
          </StatBadge>
        )}
        {lse !== null && (
          <StatBadge color="#10b981">
            <div className="label">LSE</div>
            <div className="value">{lse} {unit}</div>
          </StatBadge>
        )}
      </StatsGrid>
      
      <StatsGrid>
        <StatBadge color="#10b981">
          <div className="label">✅ Dentro de Especificación</div>
          <div className="value">{((withinSpec / data.length) * 100).toFixed(1)}%</div>
        </StatBadge>
        {lie !== null && (
          <StatBadge color="#ef4444">
            <div className="label">⚠️ Fuera (&lt; LIE)</div>
            <div className="value">{((belowLIE / data.length) * 100).toFixed(2)}%</div>
          </StatBadge>
        )}
        {lse !== null && (
          <StatBadge color="#ef4444">
            <div className="label">⚠️ Fuera (&gt; LSE)</div>
            <div className="value">{((aboveLSE / data.length) * 100).toFixed(2)}%</div>
          </StatBadge>
        )}
      </StatsGrid>
    </ChartContainer>
  );
};

export default ProcessHistogramECharts;