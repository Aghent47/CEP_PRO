import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as echarts from 'echarts';
import { testNormality, type NormalityResult } from '../../utils/normalityTests';

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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetricCard = styled.div`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 0.75rem;
  
  .label {
    font-size: 0.65rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }
  
  .value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    font-family: monospace;
  }
  
  .interpretation {
    font-size: 0.7rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }
`;

const RecommendationsBox = styled.div`
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
  
  .recommendation-item {
    font-size: 0.75rem;
    color: var(--text-secondary);
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--border-light);
    
    &:last-child {
      border-bottom: none;
    }
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: flex-end;
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

const ChartWrapper = styled.div`
  width: 100%;
  height: 400px;
  margin-top: 1rem;
`;

interface NormalityCheckProps {
  data: number[];
  onProceed: (action: 'continue' | 'transform' | 'empirical' | 'skip') => void;
  onTransform: (lambda: number) => void;
}

const NormalityCheck: React.FC<NormalityCheckProps> = ({ data, onProceed, onTransform }) => {
  const [result, setResult] = useState<NormalityResult | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (data.length > 0) {
      const normalityResult = testNormality(data);
      setResult(normalityResult);
    }
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || !result) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);

    const { theoretical, sample } = result.qqData;
    
    // Calcular línea de referencia
    const meanSample = sample.reduce((a, b) => a + b, 0) / sample.length;
    const stdSample = Math.sqrt(sample.reduce((acc, val) => acc + Math.pow(val - meanSample, 2), 0) / (sample.length - 1));
    
    const minTheo = Math.min(...theoretical);
    const maxTheo = Math.max(...theoretical);
    const refLine = [minTheo, maxTheo].map(z => meanSample + stdSample * z);

    const option: echarts.EChartsOption = {
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
          return `
            <strong>Q-Q Plot</strong><br/>
            Cuantil teórico: ${params[0].value[0].toFixed(4)}<br/>
            Cuantil muestral: ${params[0].value[1].toFixed(4)}
          `;
        }
      },
      grid: {
        left: '10%',
        right: '8%',
        top: '10%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        name: 'Cuantiles teóricos (Normal)',
        type: 'value',
        axisLabel: { color: '#8f9bb3', fontSize: 11 },
        axisLine: { lineStyle: { color: '#2a3448' } },
        splitLine: { lineStyle: { color: '#1a2235', type: 'dashed' } }
      },
      yAxis: {
        name: 'Cuantiles muestrales',
        type: 'value',
        axisLabel: { color: '#8f9bb3', fontSize: 11 },
        axisLine: { lineStyle: { color: '#2a3448' } },
        splitLine: { lineStyle: { color: '#1a2235', type: 'dashed' } }
      },
      series: [
        {
          name: 'Datos',
          type: 'scatter',
          data: theoretical.map((t, i) => [t, sample[i]]),
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: 'Referencia Normal',
          type: 'line',
          data: [
            [minTheo, refLine[0]],
            [maxTheo, refLine[1]]
          ],
          lineStyle: {
            color: '#ef4444',
            width: 2,
            type: 'dashed'
          },
          symbol: 'none'
        }
      ],
      legend: {
        data: ['Datos', 'Referencia Normal'],
        textStyle: { color: '#8f9bb3', fontSize: 11 },
        left: 'left',
        top: 0
      },
      toolbox: {
        feature: {
          saveAsImage: { title: 'Guardar como imagen', name: 'qq_plot' }
        }
      }
    };

    chartInstance.current.setOption(option);

    return () => {
      chartInstance.current?.dispose();
    };
  }, [result]);

  if (!result) {
    return (
      <Container>
        <Title>📊 Verificando normalidad...</Title>
      </Container>
    );
  }

  return (
    <Container>
      <Title>📊 Verificación de Normalidad (Shapiro-Wilk)</Title>
      
      <ResultBox isNormal={result.isNormal}>
        <div className="status">
          {result.isNormal ? '✅ DATOS NORMALES' : '⚠️ DATOS NO NORMALES'}
        </div>
        <div className="message">
          {result.isNormal 
            ? 'Los datos siguen una distribución normal. Puede continuar con el análisis estándar.'
            : 'Los datos NO siguen una distribución normal. Se recomienda aplicar una transformación.'}
        </div>
      </ResultBox>
      
      <MetricsGrid>
        <MetricCard>
          <div className="label">Shapiro-Wilk W</div>
          <div className="value">{result.shapiroWilk.statistic.toFixed(4)}</div>
          <div className="interpretation">p-valor: {result.shapiroWilk.pValue.toFixed(4)}</div>
        </MetricCard>
        <MetricCard>
          <div className="label">Asimetría (Skewness)</div>
          <div className="value">{result.skewness.value.toFixed(4)}</div>
          <div className="interpretation">{result.skewness.interpretation}</div>
        </MetricCard>
        <MetricCard>
          <div className="label">Curtosis (Kurtosis)</div>
          <div className="value">{result.kurtosis.value.toFixed(4)}</div>
          <div className="interpretation">{result.kurtosis.interpretation}</div>
        </MetricCard>
      </MetricsGrid>
      
      <Title>📈 Gráfico Q-Q (Quantile-Quantile Plot)</Title>
      <ChartWrapper ref={chartRef} />
      
      <RecommendationsBox>
        <div className="title">📋 Recomendaciones según el documento</div>
        {result.recommendations.map((rec, idx) => (
          <div key={idx} className="recommendation-item">{rec}</div>
        ))}
      </RecommendationsBox>
      
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