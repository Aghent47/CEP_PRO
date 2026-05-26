import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as echarts from 'echarts';

// ============ FUNCIONES DE NORMALIDAD SIMPLIFICADAS ============
interface NormalityResult {
  isNormal: boolean;
  shapiroWilk: { statistic: number; pValue: number; interpretation: string };
  skewness: { value: number; interpretation: string };
  kurtosis: { value: number; interpretation: string };
  recommendations: string[];
  qqData: { theoretical: number[]; sample: number[] };
}

function calculateSkewness(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  const skewness = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / n;
  return skewness;
}

function calculateKurtosis(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 3;
  const kurtosis = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / n;
  return kurtosis;
}

function calculateShapiroWilk(data: number[]): { statistic: number; pValue: number } {
  const n = data.length;
  const sortedData = [...data].sort((a, b) => a - b);
  const mean = data.reduce((a, b) => a + b, 0) / n;
  
  const totalSS = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  
  if (totalSS === 0) return { statistic: 1, pValue: 1 };
  
  // Coeficientes aproximados
  const aCoeffs: number[] = [];
  for (let i = 0; i < n; i++) {
    const m = i + 1;
    const approx = Math.sqrt(2 / (n + 1)) * (m - (n + 1) / 2);
    aCoeffs.push(approx);
  }
  
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += aCoeffs[i] * sortedData[i];
  }
  numerator = Math.pow(numerator, 2);
  
  const W = numerator / totalSS;
  
  let pValue = 0.5;
  if (W > 0.98) pValue = 0.8;
  else if (W > 0.95) pValue = 0.5;
  else if (W > 0.90) pValue = 0.2;
  else if (W > 0.85) pValue = 0.05;
  else pValue = 0.01;
  
  return { statistic: W, pValue };
}

function generateQQData(data: number[]): { theoretical: number[]; sample: number[] } {
  const sortedData = [...data].sort((a, b) => a - b);
  const n = data.length;
  //const mean = data.reduce((a, b) => a + b, 0) / n;
  //const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  //const stdDev = Math.sqrt(variance);
  
  const theoretical: number[] = [];
  const sample: number[] = [];
  
  for (let i = 0; i < n; i++) {
    const probability = (i + 0.5) / n;
    // Aproximación del percentil normal usando función inversa
    let z = 0;
    if (probability < 0.5) {
      z = -Math.sqrt(2) * Math.sqrt(-Math.log(2 * probability));
    } else {
      z = Math.sqrt(2) * Math.sqrt(-Math.log(2 * (1 - probability)));
    }
    theoretical.push(z);
    sample.push(sortedData[i]);
  }
  
  return { theoretical, sample };
}

function testNormality(data: number[]): NormalityResult {
  if (data.length < 5) {
    return {
      isNormal: false,
      shapiroWilk: { statistic: 0, pValue: 0, interpretation: "Muestra demasiado pequeña" },
      skewness: { value: 0, interpretation: "No calculable" },
      kurtosis: { value: 0, interpretation: "No calculable" },
      recommendations: ["Se necesitan al menos 5 datos para evaluar normalidad."],
      qqData: { theoretical: [], sample: [] }
    };
  }
  
  const skewness = calculateSkewness(data);
  const kurtosis = calculateKurtosis(data);
  const shapiro = calculateShapiroWilk(data);
  const qqData = generateQQData(data);
  
  const isNormalByShapiro = shapiro.pValue >= 0.05;
  const isNormalBySkewness = Math.abs(skewness) < 1;
  const isNormalByKurtosis = Math.abs(kurtosis - 3) < 1;
  
  const isNormal = isNormalByShapiro && isNormalBySkewness && isNormalByKurtosis;
  
  const recommendations: string[] = [];
  if (!isNormal) {
    recommendations.push("⚠️ Los datos NO siguen una distribución normal.");
    recommendations.push("📊 Se recomienda una de las siguientes opciones:");
    if (skewness > 0.5) {
      recommendations.push("   📌 Opción 1: Aplicar transformación Logarítmica (λ=0)");
      recommendations.push("   📌 Opción 2: Aplicar transformación Raíz Cuadrada (λ=0.5)");
    }
    if (kurtosis > 4) {
      recommendations.push("   📌 Opción 3: Aplicar transformación Box-Cox");
    }
    recommendations.push("   📌 Opción 4: Usar límites empíricos basados en percentiles");
  } else {
    recommendations.push("✅ Los datos son normales. Puede proceder con el análisis.");
  }
  
  return {
    isNormal,
    shapiroWilk: {
      statistic: shapiro.statistic,
      pValue: shapiro.pValue,
      interpretation: shapiro.pValue >= 0.05 ? "Normal" : "No normal"
    },
    skewness: {
      value: skewness,
      interpretation: Math.abs(skewness) < 0.5 ? "Simétrico" : Math.abs(skewness) < 1 ? "Moderadamente sesgado" : "Fuertemente sesgado"
    },
    kurtosis: {
      value: kurtosis,
      interpretation: Math.abs(kurtosis - 3) < 0.5 ? "Mesocúrtico" : kurtosis > 3.5 ? "Leptocúrtico" : "Platicúrtico"
    },
    recommendations,
    qqData
  };
}

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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

const ChartWrapper = styled.div`
  width: 100%;
  height: 450px;
  margin-top: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 0.5rem;
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
    console.log('=== NORMALITY CHECK ===');
    console.log('Datos recibidos:', data.length);
    console.log('Primeros 5 datos:', data.slice(0, 5));
    
    if (data.length > 0) {
      const normalityResult = testNormality(data);
      console.log('Resultado normalidad:', normalityResult.isNormal);
      console.log('QQ Data:', normalityResult.qqData.theoretical.length);
      setResult(normalityResult);
    }
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || !result || result.qqData.theoretical.length === 0) {
      console.log('No se puede renderizar gráfico: chartRef o result no disponible');
      return;
    }

    console.log('Renderizando Q-Q Plot...');
    console.log('Teóricos:', result.qqData.theoretical.length);
    console.log('Muestrales:', result.qqData.sample.length);

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);

    const { theoretical, sample } = result.qqData;
    
    // Calcular línea de referencia
    const n = theoretical.length;
    const sumX = theoretical.reduce((a, b) => a + b, 0);
    const sumY = sample.reduce((a, b) => a + b, 0);
    const sumXY = theoretical.reduce((acc, x, i) => acc + x * sample[i], 0);
    const sumX2 = theoretical.reduce((acc, x) => acc + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const minX = Math.min(...theoretical);
    const maxX = Math.max(...theoretical);
    const refLine = [
      [minX, intercept + slope * minX],
      [maxX, intercept + slope * maxX]
    ];
    
    // Datos para scatter
    const scatterData = theoretical.map((t, i) => [t, sample[i]]);
    
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        show: true,
        text: 'Gráfico Q-Q (Quantile-Quantile Plot)',
        textStyle: { color: '#e8edf5', fontSize: 13 },
        left: 'center',
        top: 0
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(26, 34, 53, 0.95)',
        borderColor: '#2a3448',
        borderWidth: 1,
        textStyle: { color: '#e8edf5', fontSize: 12 },
        formatter: (params: any) => {
          if (params.data && params.data.value) {
            return `
              <strong>📊 Punto Q-Q</strong><br/>
              Teórico: ${params.data.value[0].toFixed(4)}<br/>
              Muestral: ${params.data.value[1].toFixed(4)}
            `;
          }
          return '';
        }
      },
      grid: {
        left: '12%',
        right: '8%',
        top: '15%',
        bottom: '10%',
        containLabel: true,
        backgroundColor: 'rgba(26, 34, 53, 0.2)'
      },
      xAxis: {
        name: 'Cuantiles Teóricos',
        nameLocation: 'middle',
        nameGap: 35,
        type: 'value',
        axisLabel: { color: '#8f9bb3', fontSize: 10 },
        axisLine: { lineStyle: { color: '#2a3448' } },
        splitLine: { lineStyle: { color: '#1a2235', type: 'dashed' } }
      },
      yAxis: {
        name: 'Cuantiles Muestrales',
        nameLocation: 'middle',
        nameGap: 45,
        type: 'value',
        axisLabel: { color: '#8f9bb3', fontSize: 10 },
        axisLine: { lineStyle: { color: '#2a3448' } },
        splitLine: { lineStyle: { color: '#1a2235', type: 'dashed' } }
      },
      series: [
        {
          name: 'Datos',
          type: 'scatter',
          data: scatterData,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#0a0e1a',
            borderWidth: 1
          },
          emphasis: {
            scale: 1.3,
            itemStyle: { color: '#f59e0b' }
          }
        },
        {
          name: 'Referencia Normal',
          type: 'line',
          data: refLine,
          lineStyle: {
            color: '#ef4444',
            width: 2.5,
            type: 'solid'
          },
          symbol: 'none'
        }
      ],
      legend: {
        data: ['Datos', 'Referencia Normal'],
        orient: 'horizontal',
        left: 'left',
        top: 30,
        textStyle: { color: '#8f9bb3', fontSize: 11 }
      },
      toolbox: {
        feature: {
          saveAsImage: { title: 'Guardar como imagen' },
          zoom: { title: { zoom: 'Zoom', back: 'Restablecer' } },
          restore: { title: 'Restablecer' }
        },
        iconStyle: { borderColor: '#8f9bb3' }
      }
    };

    chartInstance.current.setOption(option);
    console.log('Gráfico renderizado correctamente');

    const handleResize = () => {
      chartInstance.current?.resize();
    };
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

  return (
    <Container>
      <Title>📊 Verificación de Normalidad</Title>
      
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
      
      <ChartWrapper ref={chartRef} />
      
      <RecommendationsBox>
        <div className="title">📋 Recomendaciones</div>
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