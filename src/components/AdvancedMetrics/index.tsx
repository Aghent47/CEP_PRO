import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import * as echarts from 'echarts';
import type { EChartsOption, LineSeriesOption } from 'echarts';
import {
  analyzeSamplingStrategies,
  getPowerTable,
  getOCCurveData,
  calculateAllAdvancedMetrics
} from '../../utils/advancedMetrics';

const MetricsContainer = styled.div`
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

const ConfigPanel = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  input, select {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    color: var(--text-primary);
    font-size: 0.875rem;
    min-width: 150px;
    
    &:focus {
      outline: none;
      border-color: var(--accent-primary);
    }
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const MetricCard = styled.div`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  
  .label {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  
  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    font-family: monospace;
  }
  
  .unit {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin-left: 0.25rem;
  }
  
  .description {
    font-size: 0.7rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }
`;

const PowerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.75rem;
  
  th, td {
    border: 1px solid var(--border-color);
    padding: 0.5rem;
    text-align: center;
  }
  
  th {
    background: var(--bg-secondary);
    color: var(--accent-primary);
    font-weight: 600;
  }
  
  td {
    color: var(--text-secondary);
  }
  
  .good {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    font-weight: 600;
  }
  
  .warning {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  
  .bad {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`;

const RecommendationBox = styled.div`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  border-left: 3px solid var(--accent-primary);
  
  .title {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--accent-primary);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }
  
  .text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 400px;
  margin-top: 1rem;
`;

interface AdvancedMetricsProps {
  currentN: number;
  currentSamplingTime?: number;
}

const AdvancedMetrics: React.FC<AdvancedMetricsProps> = ({ 
  currentN, 
  currentSamplingTime = 1 
}) => {
  const [samplingTime, setSamplingTime] = useState<number>(currentSamplingTime);
  const [view, setView] = useState<'power' | 'arl' | 'strategies'>('power');
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const metrics = calculateAllAdvancedMetrics(currentN, samplingTime);
  const powerTable = getPowerTable();
  const strategies = analyzeSamplingStrategies(currentN, samplingTime);

  const getPowerClass = (power: number): string => {
    if (power >= 0.8) return 'good';
    if (power >= 0.5) return 'warning';
    return 'bad';
  };

  // Renderizar curva de potencia
  useEffect(() => {
    if (view !== 'power' || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);

    const nValues = [3, 5, 10];
    const colors = ['#3b82f6', '#10b981', '#f59e0b'];
    
    const series: LineSeriesOption[] = nValues.map((n, idx) => {
      const curveData = getOCCurveData(n);
      return {
        name: `n = ${n}`,
        type: 'line' as const,
        data: curveData.power,
        smooth: true,
        lineStyle: { width: 2, color: colors[idx] },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: colors[idx] }
      };
    });

    // Filtrar nombres válidos para la leyenda (eliminar undefined)
    const legendNames = series.map(s => s.name).filter((name): name is string => name !== undefined);

    const option: EChartsOption = {
      backgroundColor: 'transparent',
      title: { show: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(26, 34, 53, 0.95)',
        borderColor: '#2a3448',
        borderWidth: 1,
        textStyle: { color: '#e8edf5', fontSize: 12 },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          let result = `<strong>Cambio (δ): ${params[0].axisValue} σ</strong><br/>`;
          params.forEach((p: any) => {
            result += `${p.marker} ${p.seriesName}: ${(p.value * 100).toFixed(1)}%<br/>`;
          });
          return result;
        }
      },
      grid: {
        left: '10%',
        right: '8%',
        top: '15%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        name: 'Magnitud del cambio (δ en sigma)',
        type: 'category',
        data: getOCCurveData(5).deltas,
        axisLabel: { color: '#8f9bb3', fontSize: 11 },
        axisLine: { lineStyle: { color: '#2a3448' } },
        nameTextStyle: { color: '#8f9bb3' }
      },
      yAxis: {
        name: 'Potencia (1-β)',
        type: 'value',
        min: 0,
        max: 1,
        axisLabel: { 
          color: '#8f9bb3',
          fontSize: 11,
          formatter: (value: number) => `${(value * 100).toFixed(0)}%`
        },
        axisLine: { lineStyle: { color: '#2a3448' } },
        splitLine: { lineStyle: { color: '#1a2235', type: 'dashed' } },
        nameTextStyle: { color: '#8f9bb3' }
      },
      series: series,
      legend: {
        data: legendNames,
        textStyle: { color: '#8f9bb3', fontSize: 11 },
        top: 0,
        left: 'left'
      },
      toolbox: {
        feature: {
          saveAsImage: { 
            title: 'Guardar como imagen',
            name: 'curva_potencia'
          }
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
  }, [view]);

  return (
    <MetricsContainer>
      <Title>⚡ Métricas de Eficiencia del Sistema de Control</Title>
      
      <ConfigPanel>
        <InputGroup>
          <label>Tamaño del Subgrupo (n)</label>
          <input type="number" value={currentN} disabled style={{ opacity: 0.7 }} />
        </InputGroup>
        <InputGroup>
          <label>Tiempo entre muestras (horas)</label>
          <input 
            type="number" 
            step="0.5"
            min="0.5"
            value={samplingTime}
            onChange={(e) => setSamplingTime(Number(e.target.value))}
          />
        </InputGroup>
        <InputGroup>
          <label>Vista</label>
          <select value={view} onChange={(e) => setView(e.target.value as any)}>
            <option value="power">Análisis de Potencia</option>
            <option value="arl">ARL y ATS</option>
            <option value="strategies">Estrategias de Muestreo</option>
          </select>
        </InputGroup>
      </ConfigPanel>

      {view === 'power' && (
        <>
          <MetricsGrid>
            <MetricCard>
              <div className="label">ARL₀ (En control)</div>
              <div className="value">{Math.round(metrics.arl0).toLocaleString()}</div>
              <div className="unit">subgrupos</div>
              <div className="description">Promedio entre falsas alarmas (α=0.27%)</div>
            </MetricCard>
            <MetricCard>
              <div className="label">Potencia para δ=1σ</div>
              <div className="value">{((1 - 1/metrics.arl1_for_delta_1) * 100).toFixed(1)}%</div>
              <div className="description">Probabilidad de detectar cambio de 1σ en 1 subgrupo</div>
            </MetricCard>
            <MetricCard>
              <div className="label">ARL₁ para δ=1σ</div>
              <div className="value">{metrics.arl1_for_delta_1.toFixed(1)}</div>
              <div className="unit">subgrupos</div>
              <div className="description">Subgrupos promedio para detectar cambio</div>
            </MetricCard>
            <MetricCard>
              <div className="label">Carga Muestral</div>
              <div className="value">{metrics.sampleLoad.toFixed(1)}</div>
              <div className="unit">mediciones/hora</div>
              <div className="description">Esfuerzo de inspección requerido</div>
            </MetricCard>
          </MetricsGrid>

          <Title style={{ marginTop: '1rem' }}>📊 Curva de Potencia (OC Curve)</Title>
          <ChartWrapper ref={chartRef} />

          <Title style={{ marginTop: '1rem' }}>📋 Tabla de Potencia según n y δ</Title>
          <PowerTable>
            <thead>
              <tr>
                <th>δ (cambio)</th>
                {powerTable.nValues.map(n => <th key={n}>n = {n}</th>)}
              </tr>
            </thead>
            <tbody>
              {powerTable.deltas.map((delta, i) => (
                <tr key={delta}>
                  <td><strong>{delta} σ</strong></td>
                  {powerTable.powerMatrix[i].map((power, j) => (
                    <td key={j} className={getPowerClass(power)}>
                      {(power * 100).toFixed(1)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </PowerTable>
        </>
      )}

      {view === 'arl' && (
        <>
          <MetricsGrid>
            <MetricCard>
              <div className="label">ARL₀ (En control)</div>
              <div className="value">{Math.round(metrics.arl0).toLocaleString()}</div>
              <div className="unit">subgrupos</div>
              <div className="description">1 falsa alarma cada ~370 subgrupos</div>
            </MetricCard>
            <MetricCard>
              <div className="label">ATS₀ (En control)</div>
              <div className="value">{metrics.ats0.toFixed(1)}</div>
              <div className="unit">horas</div>
              <div className="description">Tiempo promedio entre falsas alarmas</div>
            </MetricCard>
            <MetricCard>
              <div className="label">ARL₁ para δ=1σ</div>
              <div className="value">{metrics.arl1_for_delta_1.toFixed(1)}</div>
              <div className="unit">subgrupos</div>
              <div className="description">Subgrupos para detectar cambio de 1σ</div>
            </MetricCard>
            <MetricCard>
              <div className="label">ATS₁ para δ=1σ</div>
              <div className="value">{metrics.ats1_for_delta_1.toFixed(1)}</div>
              <div className="unit">horas</div>
              <div className="description">Tiempo para detectar cambio de 1σ</div>
            </MetricCard>
          </MetricsGrid>

          <MetricsGrid>
            <MetricCard>
              <div className="label">ARL₁ para δ=0.5σ</div>
              <div className="value">{metrics.arl1_for_delta_0_5.toFixed(1)}</div>
              <div className="unit">subgrupos</div>
              <div className="description">Cambios pequeños son más difíciles de detectar</div>
            </MetricCard>
            <MetricCard>
              <div className="label">ARL₁ para δ=1.5σ</div>
              <div className="value">{metrics.arl1_for_delta_1_5.toFixed(1)}</div>
              <div className="unit">subgrupos</div>
              <div className="description">Cambios grandes se detectan rápidamente</div>
            </MetricCard>
            <MetricCard>
              <div className="label">ARL₁ para δ=2σ</div>
              <div className="value">{metrics.arl1_for_delta_2.toFixed(1)}</div>
              <div className="unit">subgrupos</div>
              <div className="description">Cambios muy grandes se detectan casi de inmediato</div>
            </MetricCard>
          </MetricsGrid>

          <RecommendationBox>
            <div className="title">🎯 Interpretación</div>
            <div className="text">
              {metrics.recommendations}
            </div>
          </RecommendationBox>
        </>
      )}

      {view === 'strategies' && (
        <>
          <PowerTable>
            <thead>
              <tr>
                <th>Estrategia</th>
                <th>n</th>
                <th>t_muestra (h)</th>
                <th>Carga (med/h)</th>
                <th>ARL₁ (δ=1)</th>
                <th>ATS (horas)</th>
                <th>Recomendación</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strat, idx) => (
                <tr key={idx}>
                  <td>{strat.n === currentN && strat.samplingTime === samplingTime ? '✓ Actual' : ''}</td>
                  <td><strong>{strat.n}</strong></td>
                  <td>{strat.samplingTime}</td>
                  <td>{strat.loadPerHour.toFixed(1)}</td>
                  <td className={strat.arl1 <= 5 ? 'good' : strat.arl1 <= 10 ? 'warning' : 'bad'}>
                    {strat.arl1.toFixed(1)}
                  </td>
                  <td>{strat.ats.toFixed(1)}</td>
                  <td style={{ fontSize: '0.7rem' }}>{strat.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </PowerTable>

          <RecommendationBox>
            <div className="title">📌 Recomendación según prioridad</div>
            <div className="text">
              <strong>Para detectar cambios pequeños rápidamente:</strong> n grande (≥10), muestreo frecuente<br/>
              <strong>Para minimizar esfuerzo de inspección:</strong> n pequeño (3-5), muestreo menos frecuente<br/>
              <strong>Balance óptimo:</strong> n=5 cada 1 hora (carga=5 med/h, ATS≈5h para δ=1σ)
            </div>
          </RecommendationBox>
        </>
      )}
    </MetricsContainer>
  );
};

export default AdvancedMetrics;