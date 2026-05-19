import React from 'react';
import styled from 'styled-components';

const ResultsContainer = styled.div`
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

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const MetricCard = styled.div<{ status?: 'capable' | 'marginal' | 'notcapable' }>`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid ${props => {
    if (props.status === 'capable') return '#10b981';
    if (props.status === 'marginal') return '#f59e0b';
    if (props.status === 'notcapable') return '#ef4444';
    return 'var(--border-color)';
  }};
  
  .label {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  
  .value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
    font-family: monospace;
  }
  
  .interpretation {
    font-size: 0.7rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }
`;

const ClassificationBadge = styled.div<{ grade: 'A' | 'B' | 'C' | 'D' }>`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 1rem;
  background: ${props => {
    if (props.grade === 'A') return 'rgba(16, 185, 129, 0.2)';
    if (props.grade === 'B') return 'rgba(59, 130, 246, 0.2)';
    if (props.grade === 'C') return 'rgba(245, 158, 11, 0.2)';
    return 'rgba(239, 68, 68, 0.2)';
  }};
  color: ${props => {
    if (props.grade === 'A') return '#10b981';
    if (props.grade === 'B') return '#3b82f6';
    if (props.grade === 'C') return '#f59e0b';
    return '#ef4444';
  }};
  border: 1px solid currentColor;
`;

const RecommendationBox = styled.div`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  border: 1px solid var(--border-color);
  
  .title {
    font-size: 0.75rem;
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

interface CapabilityResultsProps {
  cp: number | null;
  cpk: number | null;
  cpl: number | null;
  cpu: number | null;
  k: number | null;
  ppm: number | null;
  sigmaLevel: number | null;
  isStable: boolean;
  hasSpecs: boolean;
}

const CapabilityResults: React.FC<CapabilityResultsProps> = ({
  cp,
  cpk,
  cpl,
  cpu,
  k,
  ppm,
  sigmaLevel,
  isStable,
  hasSpecs
}) => {
  if (!hasSpecs) return null;

  const getCpStatus = (value: number): 'capable' | 'marginal' | 'notcapable' => {
    if (value >= 1.33) return 'capable';
    if (value >= 1.0) return 'marginal';
    return 'notcapable';
  };

  const getCpkStatus = (value: number): 'capable' | 'marginal' | 'notcapable' => {
    if (value >= 1.33) return 'capable';
    if (value >= 1.0) return 'marginal';
    return 'notcapable';
  };

  const getClassification = (): { grade: 'A' | 'B' | 'C' | 'D'; text: string } => {
    if (!cpk) return { grade: 'D', text: 'No disponible' };
    // Para Cpk >= 1.67 mostramos A+ pero internamente usamos A para el badge
    if (cpk >= 1.67) return { grade: 'A', text: 'Excelente - Muy capaz (A+)' };
    if (cpk >= 1.33) return { grade: 'A', text: 'Muy capaz - Proceso excelente' };
    if (cpk >= 1.0) return { grade: 'B', text: 'Capaz - Proceso aceptable' };
    if (cpk >= 0.67) return { grade: 'C', text: 'Marginalmente capaz - Requiere mejora' };
    return { grade: 'D', text: 'No capaz - Requiere acción inmediata' };
  };

  const getRecommendation = (): string => {
    if (!isStable) {
      return "⚠️ El proceso NO es estable. Los índices de capacidad no son confiables. Primero estabilice el proceso (Fase I) antes de interpretar la capacidad.";
    }
    
    if (!cpk) return "Ingrese los límites de especificación para calcular la capacidad.";
    
    if (cpk >= 1.67) {
      return "✅ El proceso es excelente (A+). Mantenga el control con las cartas de control y continúe monitoreando.";
    }
    
    if (cpk >= 1.33) {
      return "✅ El proceso es muy capaz (A). Mantenga el control con las cartas de control y continúe monitoreando.";
    }
    
    if (cpk >= 1.0) {
      if (cp && cpk && cpk < cp) {
        return "📊 El proceso es marginalmente capaz (B) pero está descentrado. Ajuste la media del proceso hacia el objetivo para mejorar Cpk.";
      }
      return "⚠️ El proceso es marginalmente capaz (B). Requiere control estricto y monitoreo frecuente. Considere reducir la variabilidad.";
    }
    
    if (cpl && cpl < 1.0 && cpu && cpu < 1.0) {
      return "🔴 El proceso no es capaz (C/D) por alta variabilidad y mal centrado. Reduzca la variabilidad y centre el proceso.";
    }
    
    if (cpl && cpl < 1.0) {
      return "🔴 El proceso no es capaz (C/D) por el límite inferior. Revise si hay problemas con materiales o configuración que afecten el límite inferior.";
    }
    
    if (cpu && cpu < 1.0) {
      return "🔴 El proceso no es capaz (C/D) por el límite superior. Revise desgaste de herramientas, temperatura u otros factores que afecten el límite superior.";
    }
    
    return "🔴 El proceso no es capaz. Requiere acciones correctivas inmediatas.";
  };

  const classification = getClassification();

  return (
    <ResultsContainer>
      <Title>📊 Análisis de Capacidad del Proceso</Title>
      
      <ClassificationBadge grade={classification.grade}>
        Clasificación {classification.grade}: {classification.text}
      </ClassificationBadge>
      
      <MetricsGrid>
        <MetricCard status={cp ? getCpStatus(cp) : undefined}>
          <div className="label">Cp (Capacidad Potencial)</div>
          <div className="value">{cp ? cp.toFixed(4) : '—'}</div>
          <div className="interpretation">
            {cp ? (
              cp >= 1.67 ? '✓ Excelente' : cp >= 1.33 ? '✓ Capaz' : cp >= 1.0 ? '⚠️ Marginal' : '✗ No capaz'
            ) : 'No calculado'}
          </div>
        </MetricCard>
        
        <MetricCard status={cpk ? getCpkStatus(cpk) : undefined}>
          <div className="label">Cpk (Capacidad Real)</div>
          <div className="value">{cpk ? cpk.toFixed(4) : '—'}</div>
          <div className="interpretation">
            {cpk ? (
              cpk >= 1.67 ? '✓ Excelente (A+)' : cpk >= 1.33 ? '✓ Capaz (A)' : cpk >= 1.0 ? '⚠️ Marginal (B)' : '✗ No capaz (C/D)'
            ) : 'No calculado'}
          </div>
        </MetricCard>
        
        <MetricCard>
          <div className="label">Cpl (Límite Inferior)</div>
          <div className="value">{cpl ? cpl.toFixed(4) : '—'}</div>
          <div className="interpretation">
            {cpl ? (cpl >= 1.0 ? '✓ Capaz' : '✗ No capaz') : ''}
          </div>
        </MetricCard>
        
        <MetricCard>
          <div className="label">Cpu (Límite Superior)</div>
          <div className="value">{cpu ? cpu.toFixed(4) : '—'}</div>
          <div className="interpretation">
            {cpu ? (cpu >= 1.0 ? '✓ Capaz' : '✗ No capaz') : ''}
          </div>
        </MetricCard>
      </MetricsGrid>
      
      <MetricsGrid>
        <MetricCard>
          <div className="label">Índice K (Descentramiento)</div>
          <div className="value">{k !== null ? `${k.toFixed(1)}%` : '—'}</div>
          <div className="interpretation">
            {k !== null ? (
              k === 0 ? '✓ Perfectamente centrado' : k < 25 ? '✓ Centrado aceptable' : k < 50 ? '⚠️ Descentramiento moderado' : '✗ Descentramiento severo'
            ) : 'No calculado'}
          </div>
        </MetricCard>
        
        <MetricCard>
          <div className="label">Nivel Sigma (Z bench)</div>
          <div className="value">{sigmaLevel ? sigmaLevel.toFixed(2) : '—'} σ</div>
          <div className="interpretation">
            {sigmaLevel ? (
              sigmaLevel >= 4 ? '✓ Excelente' : sigmaLevel >= 3 ? '✓ Bueno' : sigmaLevel >= 2 ? '⚠️ Regular' : '✗ Malo'
            ) : 'No calculado'}
          </div>
        </MetricCard>
        
        <MetricCard>
          <div className="label">PPM Esperado</div>
          <div className="value">{ppm ? Math.round(ppm).toLocaleString() : '—'}</div>
          <div className="interpretation">
            {ppm ? (
              ppm < 1000 ? '✓ Muy bajo' : ppm < 10000 ? '⚠️ Moderado' : '✗ Alto'
            ) : 'No calculado'}
          </div>
        </MetricCard>
      </MetricsGrid>
      
      <RecommendationBox>
        <div className="title">🎯 Recomendación</div>
        <div className="text">{getRecommendation()}</div>
      </RecommendationBox>
    </ResultsContainer>
  );
};

export default CapabilityResults;