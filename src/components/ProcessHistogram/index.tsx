import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
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

const ProcessHistogram: React.FC<ProcessHistogramProps> = ({
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

  if (data.length === 0 || sigma === 0 || !sigma || sigma < 0.0001) return null;

  // ============ 1. CALCULAR HISTOGRAMA ============
  const numBins = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(data.length))));
  const minData = Math.min(...data);
  const maxData = Math.max(...data);
  const binWidth = (maxData - minData) / numBins;
  
  const bins: number[] = [];
  const frequencies: number[] = [];
  
  for (let i = 0; i < numBins; i++) {
    const binStart = minData + i * binWidth;
    const binEnd = binStart + binWidth;
    const binCenter = (binStart + binEnd) / 2;
    bins.push(binCenter);
    const count = data.filter(v => v >= binStart && v < binEnd).length;
    frequencies.push(count);
  }
  
  const maxFrequency = Math.max(...frequencies);
  
  // ============ 2. GENERAR CURVA NORMAL CON ESCALADO FORZADO ============
  const curveStart = mean - 3.5 * sigma;
  const curveEnd = mean + 3.5 * sigma;
  const curveStep = (curveEnd - curveStart) / 300;
  
  const curveX: number[] = [];
  const curveYRaw: number[] = []; // Densidad real (valores entre 0 y ~2.5)
  
  for (let x = curveStart; x <= curveEnd; x += curveStep) {
    curveX.push(x);
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2));
    const density = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    curveYRaw.push(density);
  }
  
  const maxDensity = Math.max(...curveYRaw);
  
  // ESCALADO FORZADO: La curva ocupará el 70% de la altura máxima del gráfico
  const forcedScaleFactor = (maxFrequency * 0.7) / maxDensity;
  const curveY = curveYRaw.map(y => y * forcedScaleFactor);
  
  // ============ 3. DETERMINAR LÍMITES DEL GRÁFICO ============
  let xAxisMin = Math.min(curveStart, minData - binWidth);
  let xAxisMax = Math.max(curveEnd, maxData + binWidth);
  
  if (lie !== null && lie < xAxisMin) xAxisMin = lie - sigma;
  if (lse !== null && lse > xAxisMax) xAxisMax = lse + sigma;
  
  const yAxisMax = Math.max(maxFrequency, Math.max(...curveY)) * 1.1;

  // ============ DIAGNÓSTICO EN CONSOLA ============
  console.log('=== PROCESO HISTOGRAMA ===');
  console.log('Media:', mean);
  console.log('Sigma:', sigma);
  console.log('maxFrequency:', maxFrequency);
  console.log('maxDensity:', maxDensity);
  console.log('forcedScaleFactor:', forcedScaleFactor);
  console.log('curveY primeros 5:', curveY.slice(0, 5));
  console.log('=========================');

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);

    const option: EChartsOption = {
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
        left: '10%',
        right: '8%',
        top: '15%',
        bottom: '10%',
        containLabel: true
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
      series: [
        {
          name: 'Histograma',
          type: 'bar',
          data: frequencies,
          barWidth: '85%',
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [4, 4, 0, 0],
            opacity: 0.6
          },
          label: { show: false },
          tooltip: {
            formatter: (params: any) => {
              const binCenter = bins[params.dataIndex];
              const percentage = ((params.value / data.length) * 100).toFixed(1);
              return `<strong>📊 Histograma</strong><br/>Centro: ${binCenter.toFixed(3)} ${unit}<br/>Frecuencia: ${params.value} (${percentage}%)`;
            }
          }
        },
        {
          name: 'Curva Normal (Campana de Gauss)',
          type: 'line',
          data: curveY,
          smooth: true,
          lineStyle: {
            color: '#fbbf24',
            width: 3.5,
            type: 'solid'
          },
          symbol: 'none',
          areaStyle: {
            color: 'rgba(251, 191, 36, 0.15)'
          },
          tooltip: {
            formatter: (params: any) => {
              const xValue = curveX[params.dataIndex];
              const densityValue = curveYRaw[params.dataIndex];
              return `<strong>📈 Curva Normal</strong><br/>Valor: ${xValue.toFixed(3)} ${unit}<br/>Densidad: ${densityValue.toFixed(4)}`;
            }
          }
        },
        {
          name: 'Media del Proceso',
          type: 'line',
          data: [],
          markLine: {
            data: [{ xAxis: mean }],
            lineStyle: {
              color: '#10b981',
              width: 2.5,
              type: 'solid'
            },
            label: {
              formatter: `Media: ${mean.toFixed(3)} ${unit}`,
              color: '#10b981',
              position: 'middle',
              fontWeight: 'bold'
            },
            symbol: 'none'
          }
        }
      ]
    };

    // Añadir LIE si existe
    if (lie !== null) {
      (option.series as any[]).push({
        name: 'LIE',
        type: 'line',
        data: [],
        markLine: {
          data: [{ xAxis: lie }],
          lineStyle: {
            color: '#f59e0b',
            width: 2.5,
            type: 'dashed'
          },
          label: {
            formatter: `LIE: ${lie} ${unit}`,
            color: '#f59e0b',
            position: 'start',
            fontWeight: 'bold'
          },
          symbol: 'none'
        }
      });
    }

    // Añadir LSE si existe
    if (lse !== null) {
      (option.series as any[]).push({
        name: 'LSE',
        type: 'line',
        data: [],
        markLine: {
          data: [{ xAxis: lse }],
          lineStyle: {
            color: '#f59e0b',
            width: 2.5,
            type: 'dashed'
          },
          label: {
            formatter: `LSE: ${lse} ${unit}`,
            color: '#f59e0b',
            position: 'end',
            fontWeight: 'bold'
          },
          symbol: 'none'
        }
      });
    }

    // Añadir objetivo si existe
    if (target !== null && target !== undefined) {
      (option.series as any[]).push({
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

    // Áreas sombreadas fuera de especificación
    if (lie !== null) {
      (option.series as any[]).push({
        name: 'Zona No Conforme',
        type: 'line',
        data: [],
        markArea: {
          data: [[{ xAxis: xAxisMin }, { xAxis: lie }]],
          itemStyle: { color: 'rgba(239, 68, 68, 0.25)' },
          label: { show: false }
        }
      });
    }

    if (lse !== null) {
      (option.series as any[]).push({
        name: 'Zona No Conforme',
        type: 'line',
        data: [],
        markArea: {
          data: [[{ xAxis: lse }, { xAxis: xAxisMax }]],
          itemStyle: { color: 'rgba(239, 68, 68, 0.25)' },
          label: { show: false }
        }
      });
    }

    const legendData = ['Histograma', 'Curva Normal (Campana de Gauss)', 'Media del Proceso'];
    if (lie !== null) legendData.push('LIE');
    if (lse !== null) legendData.push('LSE');
    if (target !== null && target !== undefined) legendData.push('Nominal');
    
    (option as any).legend = {
      data: legendData,
      orient: 'horizontal',
      left: 'left',
      top: 0,
      textStyle: { color: '#8f9bb3', fontSize: 11 },
      itemWidth: 25,
      itemHeight: 12
    };

    (option as any).toolbox = {
      feature: {
        saveAsImage: { 
          title: 'Guardar como imagen',
          name: 'histograma_campana_gauss'
        },
        zoom: { title: { zoom: 'Zoom', back: 'Restablecer' } },
        restore: { title: 'Restablecer' }
      },
      iconStyle: { borderColor: '#8f9bb3' }
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
  }, [data, mean, sigma, lie, lse, target, unit, bins, frequencies, curveX, curveYRaw, curveY, maxFrequency, xAxisMin, xAxisMax, yAxisMax]);

  // Calcular estadísticas
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
        <StatBadge color="#10b981">
          <div className="label">📊 Media del Proceso</div>
          <div className="value">{mean.toFixed(3)} {unit}</div>
        </StatBadge>
        <StatBadge color="#ef4444">
          <div className="label">📈 Sigma del Proceso</div>
          <div className="value">{sigma.toFixed(4)} {unit}</div>
        </StatBadge>
        {target !== null && target !== undefined && (
          <StatBadge color="#8b5cf6">
            <div className="label">🎯 Valor Nominal</div>
            <div className="value">{target} {unit}</div>
          </StatBadge>
        )}
        {lie !== null && (
          <StatBadge color="#f59e0b">
            <div className="label">⬇️ LIE</div>
            <div className="value">{lie} {unit}</div>
          </StatBadge>
        )}
        {lse !== null && (
          <StatBadge color="#f59e0b">
            <div className="label">⬆️ LSE</div>
            <div className="value">{lse} {unit}</div>
          </StatBadge>
        )}
      </StatsGrid>
      
      {(lie !== null || lse !== null) && (
        <StatsGrid>
          <StatBadge color="#10b981">
            <div className="label">✅ Dentro de Especificación</div>
            <div className="value">{((withinSpec / data.length) * 100).toFixed(1)}%</div>
          </StatBadge>
          {lie !== null && (
            <StatBadge color="#ef4444">
              <div className="label">⚠️ Fuera (&#60; LIE)</div>
              <div className="value">{((belowLIE / data.length) * 100).toFixed(2)}%</div>
            </StatBadge>
          )}
          {lse !== null && (
            <StatBadge color="#ef4444">
              <div className="label">⚠️ Fuera (&#62; LSE)</div>
              <div className="value">{((aboveLSE / data.length) * 100).toFixed(2)}%</div>
            </StatBadge>
          )}
        </StatsGrid>
      )}
    </ChartContainer>
  );
};

export default ProcessHistogram;