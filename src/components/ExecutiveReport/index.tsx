import React from 'react';
import styled from 'styled-components';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReportContainer = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  h3 {
    color: var(--text-primary);
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .button-group {
    display: flex;
    gap: 0.75rem;
  }
`;

const ExportButton = styled.button<{ variant?: 'pdf' | 'csv' | 'txt' }>`
  background: ${props => {
    if (props.variant === 'pdf') return '#ef4444';
    if (props.variant === 'csv') return '#10b981';
    return '#3b82f6';
  }};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
    opacity: 0.9;
  }
`;

const ReportContent = styled.div`
  font-family: monospace;
  
  hr {
    border-color: var(--border-color);
    margin: 1rem 0;
  }
  
  .section {
    margin-bottom: 1.5rem;
    
    h4 {
      color: var(--accent-primary);
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-light);
    
    .label {
      color: var(--text-tertiary);
      font-size: 0.75rem;
    }
    
    .value {
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
    }
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .metric-item {
    background: var(--bg-secondary);
    padding: 0.75rem;
    border-radius: 8px;
    text-align: center;
    
    .metric-label {
      font-size: 0.7rem;
      color: var(--text-tertiary);
      text-transform: uppercase;
    }
    
    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .metric-status {
      font-size: 0.7rem;
      margin-top: 0.25rem;
    }
  }
  
  .classification {
    text-align: center;
    padding: 1rem;
    border-radius: 12px;
    margin: 1rem 0;
    
    .grade {
      font-size: 2rem;
      font-weight: 800;
    }
    
    .text {
      font-size: 0.875rem;
    }
  }
  
  .recommendation {
    background: var(--bg-secondary);
    padding: 1rem;
    border-radius: 12px;
    border-left: 3px solid var(--accent-primary);
    
    .title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--accent-primary);
      margin-bottom: 0.5rem;
    }
    
    .text {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
  }
`;

interface ExecutiveReportProps {
  fileName: string;
  chartData: any;
  capabilityIndices: {
    cp: number | null;
    cpk: number | null;
    cpl: number | null;
    cpu: number | null;
    k: number | null;
    ppm: number | null;
    sigmaLevel: number | null;
  };
  unit: string;
  lie: number | null;
  lse: number | null;
  xbarViolations: any[];
  rViolations: any[];
  removedSubgroups: number[];
  originalSubgroupsCount: number;
  chartType: 'X-R' | 'X-s';  // AÑADIDO
}

const ExecutiveReport: React.FC<ExecutiveReportProps> = ({
  fileName,
  chartData,
  capabilityIndices,
  unit,
  lie,
  lse,
  xbarViolations,
  rViolations,
  removedSubgroups,
  originalSubgroupsCount,
  chartType  // AÑADIDO
}) => {
  const getClassification = () => {
    const cpk = capabilityIndices.cpk;
    if (!cpk) return { grade: 'D', text: 'No calculado', color: '#6b7280' };
    if (cpk >= 1.67) return { grade: 'A+', text: 'Excelente - Muy capaz', color: '#10b981' };
    if (cpk >= 1.33) return { grade: 'A', text: 'Muy capaz - Proceso excelente', color: '#10b981' };
    if (cpk >= 1.0) return { grade: 'B', text: 'Capaz - Proceso aceptable', color: '#3b82f6' };
    if (cpk >= 0.67) return { grade: 'C', text: 'Marginalmente capaz', color: '#f59e0b' };
    return { grade: 'D', text: 'No capaz', color: '#ef4444' };
  };

  const getStabilityStatus = () => {
    const totalViolations = xbarViolations.length + rViolations.length;
    if (totalViolations === 0 && removedSubgroups.length === 0) {
      return { text: 'ESTABLE', color: '#10b981', emoji: '✅' };
    }
    return { text: 'INESTABLE', color: '#ef4444', emoji: '⚠️' };
  };

  const getChartTypeName = (): string => {
    if (chartType === 'X-R') {
      return 'X-R (Medias y Rangos)';
    }
    return 'X-s (Medias y Desviación Estándar)';
  };

  const classification = getClassification();
  const stability = getStabilityStatus();

  const exportToPDF = async () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;
    
    const canvas = await html2canvas(reportElement, {
      scale: 2,
      backgroundColor: '#0a0e1a',
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`reporte_capacidad_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ['Indicador', 'Valor', 'Unidad', 'Interpretación'];
    const rows = [
      ['Gran Media (X̄̄)', chartData?.xbar.centerLine.toFixed(4) || '—', unit, 'Media del proceso'],
      ['Sigma del Proceso', (chartData?.r?.centerLine / chartData?.constants?.d2 || chartData?.s?.centerLine / chartData?.constants?.c4 || 0).toFixed(4), unit, 'Desviación estándar'],
      ['Cp', capabilityIndices.cp?.toFixed(4) || '—', '', 'Capacidad potencial'],
      ['Cpk', capabilityIndices.cpk?.toFixed(4) || '—', '', 'Capacidad real'],
      ['Cpl', capabilityIndices.cpl?.toFixed(4) || '—', '', 'Capacidad límite inferior'],
      ['Cpu', capabilityIndices.cpu?.toFixed(4) || '—', '', 'Capacidad límite superior'],
      ['Índice K', capabilityIndices.k?.toFixed(1) || '—', '%', 'Descentramiento'],
      ['Nivel Sigma', capabilityIndices.sigmaLevel?.toFixed(2) || '—', 'σ', 'Z bench'],
      ['PPM', capabilityIndices.ppm ? Math.round(capabilityIndices.ppm).toLocaleString() : '—', '', 'Partes por millón fuera de especificación'],
      ['Subgrupos totales', originalSubgroupsCount.toString(), '', ''],
      ['Subgrupos activos', chartData?.subgroups.length.toString() || '0', '', 'Después de limpieza'],
      ['Estado del proceso', stability.text, '', stability.text === 'ESTABLE' ? 'Bajo control' : 'Fuera de control']
    ];
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `reporte_capacidad_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToTXT = () => {
    // const sigmaValue = chartData?.r?.centerLine 
    //   ? (chartData.r.centerLine / chartData.constants.d2).toFixed(4)
    //   : (chartData?.s?.centerLine / chartData?.constants?.c4 || 0).toFixed(4);
    
    const content = `============================================================
        REPORTE EJECUTIVO DE CAPACIDAD
============================================================

Proceso: ${fileName}
Fecha: ${new Date().toLocaleString()}
Tipo de gráfico: ${getChartTypeName()} (n=${chartData?.constants?.n || chartData?.constants?.n || '?'}, k=${chartData?.subgroups.length || 0})
Unidad: ${unit}

------------------------------------------------------------
ESTABILIDAD: ${stability.text}
------------------------------------------------------------
Subgrupos eliminados: ${removedSubgroups.length > 0 ? removedSubgroups.map(i => i + 1).join(', ') : 'Ninguno'}

------------------------------------------------------------
CAPACIDAD DEL PROCESO
------------------------------------------------------------
Cp = ${capabilityIndices.cp?.toFixed(4) || 'No calculado'}
Cpk = ${capabilityIndices.cpk?.toFixed(4) || 'No calculado'}
Cpl = ${capabilityIndices.cpl?.toFixed(4) || 'No calculado'}
Cpu = ${capabilityIndices.cpu?.toFixed(4) || 'No calculado'}
Índice K = ${capabilityIndices.k?.toFixed(1) || 'No calculado'}%

------------------------------------------------------------
DESEMPEÑO ESPERADO
------------------------------------------------------------
Nivel Sigma: ${capabilityIndices.sigmaLevel?.toFixed(2) || 'No calculado'} σ
PPM esperado: ${capabilityIndices.ppm ? Math.round(capabilityIndices.ppm).toLocaleString() : 'No calculado'}
%PNC esperado: ${capabilityIndices.ppm ? ((capabilityIndices.ppm / 1000000) * 100).toFixed(4) : 'No calculado'}%

------------------------------------------------------------
CLASIFICACIÓN FINAL: ${classification.grade} - ${classification.text}
------------------------------------------------------------

============================================================
    `;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `reporte_capacidad_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ReportContainer>
      <ReportHeader>
        <h3>📋 Reporte Ejecutivo</h3>
        <div className="button-group">
          <ExportButton variant="txt" onClick={exportToTXT}>
            📝 Exportar TXT
          </ExportButton>
        </div>
      </ReportHeader>
      
      <ReportContent id="report-content">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--accent-primary)' }}>CONTROL ESTADÍSTICO DE PROCESOS</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            Reporte generado: {new Date().toLocaleString()}
          </p>
        </div>
        
        <hr />
        
        <div className="section">
          <h4>📊 Resumen General del Proceso</h4>
          <div className="info-row">
            <span className="label">Nombre del archivo:</span>
            <span className="value">{fileName}</span>
          </div>
          <div className="info-row">
            <span className="label">Tipo de gráfico:</span>
            <span className="value">{getChartTypeName()} (n={chartData?.constants?.n || chartData?.constants?.n || '?'}, k={chartData?.subgroups.length || 0})</span>
          </div>
          <div className="info-row">
            <span className="label">Unidad de medida:</span>
            <span className="value">{unit}</span>
          </div>
          <div className="info-row">
            <span className="label">Límites de especificación:</span>
            <span className="value">{lie !== null ? `LIE = ${lie} ${unit}` : 'No definido'} | {lse !== null ? `LSE = ${lse} ${unit}` : 'No definido'}</span>
          </div>
        </div>
        
        <hr />
        
        <div className="section">
          <h4>⚙️ Estabilidad del Proceso</h4>
          <div className="classification" style={{ background: `${stability.color}10`, border: `1px solid ${stability.color}` }}>
            <div className="grade" style={{ color: stability.color }}>{stability.emoji} {stability.text}</div>
            <div className="text" style={{ color: stability.color }}>
              {stability.text === 'ESTABLE' 
                ? 'El proceso opera bajo causas comunes de variación' 
                : 'El proceso presenta causas asignables que requieren atención'}
            </div>
          </div>
        </div>
        
        <hr />
        
        <div className="section">
          <h4>📈 Indicadores de Capacidad</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-label">Cp (Potencial)</div>
              <div className="metric-value">{capabilityIndices.cp?.toFixed(4) || '—'}</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Cpk (Real)</div>
              <div className="metric-value">{capabilityIndices.cpk?.toFixed(4) || '—'}</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Cpl (Límite Inf.)</div>
              <div className="metric-value">{capabilityIndices.cpl?.toFixed(4) || '—'}</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Cpu (Límite Sup.)</div>
              <div className="metric-value">{capabilityIndices.cpu?.toFixed(4) || '—'}</div>
            </div>
          </div>
        </div>
        
        <div className="section">
          <h4>🎯 Desempeño Esperado</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-label">Índice K</div>
              <div className="metric-value">{capabilityIndices.k?.toFixed(1) || '—'}%</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Nivel Sigma</div>
              <div className="metric-value">{capabilityIndices.sigmaLevel?.toFixed(2) || '—'} σ</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">PPM Esperado</div>
              <div className="metric-value">{capabilityIndices.ppm ? Math.round(capabilityIndices.ppm).toLocaleString() : '—'}</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">%PNC Esperado</div>
              <div className="metric-value">{capabilityIndices.ppm ? ((capabilityIndices.ppm / 1000000) * 100).toFixed(4) : '—'}%</div>
            </div>
          </div>
        </div>
        
        <hr />
        
        <div className="section">
          <h4>🏆 Clasificación Final</h4>
          <div className="classification" style={{ background: `${classification.color}15`, border: `1px solid ${classification.color}` }}>
            <div className="grade" style={{ color: classification.color }}>{classification.grade}</div>
            <div className="text" style={{ color: classification.color }}>{classification.text}</div>
          </div>
        </div>
        
        <hr />
        
        <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '1rem' }}>
          Sistema de Control Estadístico de Procesos (CEP) | Reporte generado automáticamente
        </div>
      </ReportContent>
    </ReportContainer>
  );
};

export default ExecutiveReport;