import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// ============ REGISTRAR TODOS LOS CONTROLADORES ============
// Es importante registrar LineElement para que funcione el tipo 'line'
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,    // ← Necesario para gráficos de línea
  PointElement,   // ← Necesario para puntos
  Title,
  Tooltip,
  Legend,
  Filler
);
// ========================================================

// Estilos en línea
const containerStyle: React.CSSProperties = {
  background: '#1a2235',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid #2a3448',
  marginBottom: '2rem'
};

const titleStyle: React.CSSProperties = {
  color: '#e8edf5',
  fontSize: '0.875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const chartWrapperStyle: React.CSSProperties = {
  width: '100%',
  height: '450px',
  position: 'relative'
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
  marginTop: '1rem',
  paddingTop: '1rem',
  borderTop: '1px solid #2a3448'
};

const statBadgeStyle = (color: string): React.CSSProperties => ({
  background: `${color}15`,
  borderLeft: `3px solid ${color}`,
  padding: '0.5rem',
  borderRadius: '8px'
});

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

const ProcessHistogramChartJS: React.FC<ProcessHistogramProps> = ({
  data,
  mean,
  sigma,
  lie,
  lse,
  target,
  unit,
  title = "Distribución del Proceso vs Especificaciones"
}) => {
  const chartRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!data || data.length === 0) return null;
  if (!sigma || sigma <= 0) return null;

  // ============ 1. PREPARAR HISTOGRAMA ============
  const numBins = Math.min(15, Math.max(8, Math.ceil(Math.sqrt(data.length))));
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const binWidth = (maxVal - minVal) / numBins;

  const labels: string[] = [];
  const frequencies: number[] = [];

  for (let i = 0; i < numBins; i++) {
    const binStart = minVal + i * binWidth;
    const binEnd = binStart + binWidth;
    const binCenter = (binStart + binEnd) / 2;
    labels.push(binCenter.toFixed(3));
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

  const binCenters = labels.map(l => parseFloat(l));
  const curveValues = binCenters.map(x => normalPDF(x, mean, sigma));
  
  const maxCurve = Math.max(...curveValues);
  const scaleFactor = maxFreq / maxCurve * 0.8;
  const scaledCurve = curveValues.map(v => v * scaleFactor);

  console.log('=== CHART.JS DEBUG ===');
  console.log('maxFreq:', maxFreq);
  console.log('maxCurve:', maxCurve);
  console.log('scaleFactor:', scaleFactor);
  console.log('scaledCurve max:', Math.max(...scaledCurve));

  // Configuración del gráfico - USANDO 'bar' y 'line' correctamente
  const chartData: any = {
    labels: labels,
    datasets: [
      {
        label: 'Histograma',
        type: 'bar',
        data: frequencies,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.9,
        categoryPercentage: 1.0,
        yAxisID: 'y',
      },
      {
        label: 'Curva Normal (Campana de Gauss)',
        type: 'line',
        data: scaledCurve,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 0,
        yAxisID: 'y',
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label;
            const value = context.raw;
            if (label === 'Histograma') {
              const percentage = ((value / totalData) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
            return `${label}: ${value.toFixed(4)}`;
          }
        }
      },
      legend: {
        position: 'top',
        labels: { color: '#e8edf5', font: { size: 11 } }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `Valor (${unit})`,
          color: '#8f9bb3',
          font: { size: 11 }
        },
        ticks: { color: '#8f9bb3' },
        grid: { color: '#1a2235' }
      },
      y: {
        title: {
          display: true,
          text: 'Frecuencia / Densidad',
          color: '#8f9bb3',
          font: { size: 11 }
        },
        ticks: { color: '#8f9bb3' },
        grid: { color: '#1a2235' },
        min: 0,
        max: Math.max(maxFreq, Math.max(...scaledCurve)) * 1.15
      }
    }
  };

  // Dibujar líneas verticales (LIE, LSE, Media, Nominal) usando canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawLines = () => {
      const chart = chartRef.current;
      if (!chart || !chart.scales) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      
      ctx.save();
      ctx.font = 'bold 11px monospace';
      
      const drawDashedLine = (xValue: number, color: string, label: string, yPos: number) => {
        const x = xAxis.getPixelForValue(xValue);
        if (x >= 0 && x <= chart.width) {
          ctx.beginPath();
          ctx.moveTo(x, yAxis.top);
          ctx.lineTo(x, yAxis.bottom);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          
          ctx.fillStyle = color;
          ctx.fillText(label, x + 5, yPos);
        }
      };
      
      const drawSolidLine = (xValue: number, color: string, label: string) => {
        const x = xAxis.getPixelForValue(xValue);
        if (x >= 0 && x <= chart.width) {
          ctx.beginPath();
          ctx.moveTo(x, yAxis.top);
          ctx.lineTo(x, yAxis.bottom);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([]);
          ctx.stroke();
          
          ctx.fillStyle = color;
          ctx.fillText(label, x + 5, yAxis.top + 20);
        }
      };
      
      const drawShadedArea = (startX: number, endX: number, color: string) => {
        const x1 = xAxis.getPixelForValue(startX);
        const x2 = xAxis.getPixelForValue(endX);
        if (x1 >= 0 && x2 <= chart.width && x1 < x2) {
          ctx.fillStyle = color;
          ctx.fillRect(x1, yAxis.top, x2 - x1, yAxis.bottom - yAxis.top);
        }
      };
      
      ctx.setLineDash([8, 6]);
      
      const xMin = xAxis.min;
      const xMax = xAxis.max;
      
      if (lie !== null) {
        drawShadedArea(xMin, lie, 'rgba(239, 68, 68, 0.15)');
        drawDashedLine(lie, '#10b981', `LIE: ${lie} ${unit}`, yAxis.top + 15);
      }
      
      if (lse !== null) {
        drawShadedArea(lse, xMax, 'rgba(239, 68, 68, 0.15)');
        drawDashedLine(lse, '#10b981', `LSE: ${lse} ${unit}`, yAxis.bottom - 10);
      }
      
      if (target !== null && target !== undefined) {
        drawDashedLine(target, '#8b5cf6', `Nominal: ${target} ${unit}`, yAxis.top + 40);
      }
      
      drawSolidLine(mean, '#3b82f6', `Media: ${mean.toFixed(3)} ${unit}`);
      
      ctx.restore();
    };
    
    const timeout = setTimeout(() => {
      drawLines();
    }, 150);
    
    return () => clearTimeout(timeout);
  }, [data, mean, sigma, lie, lse, target, unit, labels, frequencies]);

  // Estadísticas
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
    <div style={containerStyle}>
      <div style={titleStyle}>
        <span>📊</span> {title}
      </div>
      
      <div style={chartWrapperStyle}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        <Bar 
          ref={chartRef}
          data={chartData} 
          options={options}
        />
      </div>
      
      {lie !== null && lse !== null && (
        <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ 
            background: '#2a3448', 
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.65rem', color: '#8f9bb3' }}>
            <span>📏 Consume {toleranceUsage.toFixed(1)}% de tolerancia</span>
            <span>{toleranceUsage > 80 ? '⚠️ Alto' : toleranceUsage > 60 ? '⚠️ Moderado' : '✓ Aceptable'}</span>
          </div>
        </div>
      )}
      
      <div style={statsGridStyle}>
        <div style={statBadgeStyle('#3b82f6')}>
          <div style={{ fontSize: '0.65rem', color: '#8f9bb3', textTransform: 'uppercase' }}>Media del Proceso</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>{mean.toFixed(3)} {unit}</div>
        </div>
        <div style={statBadgeStyle('#ef4444')}>
          <div style={{ fontSize: '0.65rem', color: '#8f9bb3', textTransform: 'uppercase' }}>Sigma del Proceso</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>{sigma.toFixed(4)} {unit}</div>
        </div>
        {target !== null && target !== undefined && (
          <div style={statBadgeStyle('#8b5cf6')}>
            <div style={{ fontSize: '0.65rem', color: '#8f9bb3', textTransform: 'uppercase' }}>Valor Nominal</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>{target} {unit}</div>
          </div>
        )}
        {lie !== null && (
          <div style={statBadgeStyle('#10b981')}>
            <div style={{ fontSize: '0.65rem', color: '#8f9bb3', textTransform: 'uppercase' }}>LIE</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>{lie} {unit}</div>
          </div>
        )}
        {lse !== null && (
          <div style={statBadgeStyle('#10b981')}>
            <div style={{ fontSize: '0.65rem', color: '#8f9bb3', textTransform: 'uppercase' }}>LSE</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>{lse} {unit}</div>
          </div>
        )}
      </div>

      <div style={statsGridStyle}>
        <div style={statBadgeStyle('#10b981')}>
          <div style={{ fontSize: '0.65rem', color: '#8f9bb3', textTransform: 'uppercase' }}>✅ Dentro de Especificación</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>{((withinSpec / data.length) * 100).toFixed(1)}%</div>
        </div>
        {lie !== null && (
          <div style={statBadgeStyle('#ef4444')}>
            <div style={{ fontSize: '0.65rem', color: '#8f9bb3', textTransform: 'uppercase' }}>⚠️ Fuera (&lt; LIE)</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>{((belowLIE / data.length) * 100).toFixed(2)}%</div>
          </div>
        )}
        {lse !== null && (
          <div style={statBadgeStyle('#ef4444')}>
            <div style={{ fontSize: '0.65rem', color: '#8f9bb3', textTransform: 'uppercase' }}>⚠️ Fuera (&gt; LSE)</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>{((aboveLSE / data.length) * 100).toFixed(2)}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessHistogramChartJS;