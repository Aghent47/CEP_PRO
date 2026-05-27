import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as echarts from 'echarts';
import { testNormality, type NormalityResult } from '../../utils/normalityTests';

// ============ ESTILOS ============
const Container = styled.div`
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

const ResultBox = styled.div<{ isNormal: boolean }>`
  background: ${props => props.isNormal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
  border-left: 4px solid ${props => props.isNormal ? '#10b981' : '#f59e0b'};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  
  .status {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: ${props => props.isNormal ? '#10b981' : '#f59e0b'};
  }
  .message {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetricCard = styled.div<{ verdict?: 'normal' | 'warning' | 'error' }>`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid ${props => {
    if (props.verdict === 'normal') return '#10b981';
    if (props.verdict === 'warning') return '#f59e0b';
    if (props.verdict === 'error') return '#ef4444';
    return 'var(--border-color)';
  }};
  
  .label {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }
  .value {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    font-family: monospace;
  }
  .interpretation {
    font-size: 0.7rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    line-height: 1.4;
  }
  .criterion {
    font-size: 0.65rem;
    color: var(--text-tertiary);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-light);
  }
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 400px;
  margin-top: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 0.5rem;
`;

const ExplanationBox = styled.div`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  
  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--accent-primary);
    margin-bottom: 0.5rem;
  }
  .content {
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  .rule {
    font-family: monospace;
    background: var(--bg-tertiary);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    margin: 0.25rem 0;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'warning' | 'success' }>`
  background: ${props => {
    if (props.variant === 'warning') return '#f59e0b';
    if (props.variant === 'success') return '#10b981';
    return 'var(--gradient-primary)';
  }};
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
`;

interface NormalityCheckProps {
  data: number[];
  onProceed: (action: 'continue' | 'transform' | 'empirical' | 'skip') => void;
  onTransform: (lambda: number) => void;
}

const NormalityCheck: React.FC<NormalityCheckProps> = ({ data, onProceed, onTransform }) => {
  const [result, setResult] = useState<NormalityResult | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (data.length > 0) {
      const normalityResult = testNormality(data);
      setResult(normalityResult);
    }
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || !result || result.qqData.theoretical.length === 0) return;

    if (chartInstance.current) chartInstance.current.dispose();
    chartInstance.current = echarts.init(chartRef.current);

    const { theoretical, sample } = result.qqData;
    const n = theoretical.length;
    const sumX = theoretical.reduce((a, b) => a + b, 0);
    const sumY = sample.reduce((a, b) => a + b, 0);
    const sumXY = theoretical.reduce((acc, x, i) => acc + x * sample[i], 0);
    const sumX2 = theoretical.reduce((acc, x) => acc + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const minX = Math.min(...theoretical);
    const maxX = Math.max(...theoretical);
    const refLine = [[minX, intercept + slope * minX], [maxX, intercept + slope * maxX]];
    const scatterData = theoretical.map((t, i) => [t, sample[i]]);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: { show: true, text: 'Gráfico Q-Q (Quantile-Quantile Plot)', textStyle: { color: '#e8edf5', fontSize: 13 }, left: 'center', top: 0 },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(26, 34, 53, 0.95)',
        borderColor: '#2a3448',
        borderWidth: 1,
        textStyle: { color: '#e8edf5', fontSize: 12 },
        formatter: (params: any) => {
          if (params.data?.value) {
            return `<strong>📊 Punto Q-Q</strong><br/>Teórico: ${params.data.value[0].toFixed(4)}<br/>Muestral: ${params.data.value[1].toFixed(4)}`;
          }
          return '';
        }
      },
      grid: { left: '12%', right: '8%', top: '15%', bottom: '10%', containLabel: true, backgroundColor: 'rgba(26, 34, 53, 0.2)' },
      xAxis: { name: 'Cuantiles Teóricos', nameLocation: 'middle', nameGap: 35, type: 'value', axisLabel: { color: '#8f9bb3', fontSize: 10 }, axisLine: { lineStyle: { color: '#2a3448' } }, splitLine: { lineStyle: { color: '#1a2235', type: 'dashed' } } },
      yAxis: { name: 'Cuantiles Muestrales', nameLocation: 'middle', nameGap: 45, type: 'value', axisLabel: { color: '#8f9bb3', fontSize: 10 }, axisLine: { lineStyle: { color: '#2a3448' } }, splitLine: { lineStyle: { color: '#1a2235', type: 'dashed' } } },
      series: [
        { name: 'Datos', type: 'scatter', data: scatterData, symbol: 'circle', symbolSize: 8, itemStyle: { color: '#3b82f6', borderColor: '#0a0e1a', borderWidth: 1 }, emphasis: { scale: 1.3, itemStyle: { color: '#f59e0b' } } },
        { name: 'Referencia Normal', type: 'line', data: refLine, lineStyle: { color: '#ef4444', width: 2.5, type: 'solid' }, symbol: 'none' }
      ],
      legend: { data: ['Datos', 'Referencia Normal'], orient: 'horizontal', left: 'left', top: 30, textStyle: { color: '#8f9bb3', fontSize: 11 } },
      toolbox: { feature: { saveAsImage: { title: 'Guardar como imagen' }, zoom: { title: { zoom: 'Zoom', back: 'Restablecer' } }, restore: { title: 'Restablecer' } }, iconStyle: { borderColor: '#8f9bb3' } }
    };
    chartInstance.current.setOption(option);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [result]);

  if (!result) {
    return (
      <Container>
        <Title>📊 Verificando normalidad...</Title>
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Analizando {data.length} datos...
        </div>
      </Container>
    );
  }

  // Determinar el color de cada métrica
  const getVerdictStyle = (verdict: string): 'normal' | 'warning' | 'error' => {
    if (verdict.includes('ACEPTA') || verdict === 'NORMAL') return 'normal';
    if (verdict.includes('RECHAZA') || verdict === 'SESGO_POSITIVO' || verdict === 'SESGO_NEGATIVO') return 'error';
    return 'warning';
  };

  return (
    <Container>
      <Title>📊 Verificación de Normalidad</Title>
      
      <ResultBox isNormal={result.isNormal}>
        <div className="status">
          {result.isNormal ? '✅ DATOS NORMALES' : '⚠️ DATOS NO NORMALES'}
        </div>
        <div className="message">
          {result.isNormal 
            ? 'Los datos cumplen con los criterios de normalidad (Shapiro-Wilk p>0.05, Skewness en [-0.5,0.5], Kurtosis en [2.5,3.5])'
            : 'Los datos NO cumplen con uno o más criterios de normalidad. Se recomienda aplicar una transformación.'}
        </div>
      </ResultBox>
      
      <MetricsGrid>
        {/* Shapiro-Wilk */}
        <MetricCard verdict={getVerdictStyle(result.shapiroWilk.verdict)}>
          <div className="label">📊 Shapiro-Wilk</div>
          <div className="value">W = {result.shapiroWilk.statistic.toFixed(4)}</div>
          <div className="value">p-valor = {result.shapiroWilk.pValue.toFixed(4)}</div>
          <div className="interpretation">{result.shapiroWilk.interpretation}</div>
          <div className="criterion">
            <strong>Criterio:</strong> p-valor &gt; 0.05 → Acepta normalidad
          </div>
        </MetricCard>
        
        {/* Skewness (Asimetría) */}
        <MetricCard verdict={result.skewness.verdict === 'NORMAL' ? 'normal' : 'error'}>
          <div className="label">📐 Skewness (Asimetría)</div>
          <div className="value">{result.skewness.value.toFixed(4)}</div>
          <div className="interpretation">{result.skewness.interpretation}</div>
          <div className="criterion">
            <strong>Criterio:</strong> Rango aceptable: -0.5 a 0.5
          </div>
        </MetricCard>
        
        {/* Kurtosis (Curtosis) */}
        <MetricCard verdict={result.kurtosis.verdict === 'NORMAL' ? 'normal' : 'error'}>
          <div className="label">📊 Kurtosis (Curtosis)</div>
          <div className="value">{result.kurtosis.value.toFixed(4)}</div>
          <div className="interpretation">{result.kurtosis.interpretation}</div>
          <div className="criterion">
            <strong>Criterio:</strong> Rango aceptable: 2.5 a 3.5 (Normal = 3)
          </div>
        </MetricCard>
      </MetricsGrid>
      
      <ChartWrapper ref={chartRef} />
      
      <ExplanationBox>
        <div className="title">📖 Interpretación del Gráfico Q-Q</div>
        <div className="content">
          {result.qqInterpretation}
          <div className="rule" style={{ marginTop: '0.5rem' }}>
            ✅ Si los puntos siguen la línea roja diagonal → Datos normales<br/>
            ❌ Si se separan formando "S" o "C" → Datos NO normales
          </div>
        </div>
      </ExplanationBox>
      
      <ExplanationBox>
        <div className="title">📋 Resumen de Criterios de Normalidad</div>
        <div className="content">
          <strong>Shapiro-Wilk:</strong> p-valor &gt; 0.05 → {result.shapiroWilk.pValue > 0.05 ? '✅ Cumple' : '❌ No cumple'}<br/>
          <strong>Skewness:</strong> |valor| ≤ 0.5 → {Math.abs(result.skewness.value) <= 0.5 ? '✅ Cumple' : '❌ No cumple'} ({result.skewness.value.toFixed(4)})<br/>
          <strong>Kurtosis:</strong> 2.5 ≤ valor ≤ 3.5 → {result.kurtosis.value >= 2.5 && result.kurtosis.value <= 3.5 ? '✅ Cumple' : '❌ No cumple'} ({result.kurtosis.value.toFixed(4)})<br/>
          <strong>Gráfico Q-Q:</strong> Puntos alineados → {result.qqInterpretation.includes('✓') ? '✅ Visualmente normal' : '⚠️ Visualmente no normal'}
        </div>
      </ExplanationBox>
      
      <ExplanationBox>
        <div className="title">🎯 Recomendaciones</div>
        <div className="content">
          {result.recommendations.map((rec, idx) => (
            <div key={idx}>{rec}</div>
          ))}
        </div>
      </ExplanationBox>
      
      <ButtonsContainer>
        {!result.isNormal && (
          <>
            <Button variant="warning" onClick={() => onTransform(0)}>
              📐 Transformación Logarítmica (λ=0)
            </Button>
            <Button variant="warning" onClick={() => onTransform(0.5)}>
              📐 Transformación Raíz Cuadrada (λ=0.5)
            </Button>
            <Button variant="warning" onClick={() => onProceed('empirical')}>
              📊 Usar límites empíricos
            </Button>
          </>
        )}
        <Button variant={result.isNormal ? 'success' : 'primary'} onClick={() => onProceed('continue')}>
          {result.isNormal ? '✅ Continuar con análisis' : '⚠️ Continuar sin transformación'}
        </Button>
      </ButtonsContainer>
    </Container>
  );
};

export default NormalityCheck;