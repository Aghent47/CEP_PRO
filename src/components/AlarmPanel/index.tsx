import React, { useState } from 'react';
import styled from 'styled-components';
import type { NelsonViolation } from '../../utils/nelsonRules';

const PanelContainer = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
  overflow: hidden;
`;

const PanelHeader = styled.div<{ severity: 'high' | 'medium' | 'low' | null }>`
  padding: 1rem 1.5rem;
  background: ${props => {
    if (props.severity === 'high') return 'rgba(239, 68, 68, 0.15)';
    if (props.severity === 'medium') return 'rgba(245, 158, 11, 0.15)';
    if (props.severity === 'low') return 'rgba(59, 130, 246, 0.15)';
    return 'var(--bg-secondary)';
  }};
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  
  h4 {
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .badge {
    background: ${props => {
      if (props.severity === 'high') return '#ef4444';
      if (props.severity === 'medium') return '#f59e0b';
      if (props.severity === 'low') return '#3b82f6';
      return 'var(--text-tertiary)';
    }};
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .toggle-icon {
    color: var(--text-secondary);
    font-size: 1.25rem;
  }
`;

const ViolationsList = styled.div`
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
`;

const ViolationCard = styled.div<{ severity: 'high' | 'medium' | 'low' }>`
  background: var(--bg-secondary);
  border-left: 4px solid ${props => {
    if (props.severity === 'high') return '#ef4444';
    if (props.severity === 'medium') return '#f59e0b';
    return '#3b82f6';
  }};
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  
  .violation-title {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }
  
  .violation-description {
    color: var(--text-secondary);
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .violation-points {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    
    .point {
      background: var(--bg-tertiary);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-family: monospace;
      color: var(--text-primary);
    }
  }
`;

interface AlarmPanelProps {
  violations: NelsonViolation[];
  onPointClick?: (pointIndex: number) => void;
}

const AlarmPanel: React.FC<AlarmPanelProps> = ({ violations, onPointClick }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const getHighestSeverity = (): 'high' | 'medium' | 'low' | null => {
    if (violations.some(v => v.severity === 'high')) return 'high';
    if (violations.some(v => v.severity === 'medium')) return 'medium';
    if (violations.some(v => v.severity === 'low')) return 'low';
    return null;
  };
  
  // const severityLabels = {
  //   high: 'CRÍTICA',
  //   medium: 'ADVERTENCIA',
  //   low: 'INFORMACIÓN'
  // };
  
  const severityIcons = {
    high: '🔴',
    medium: '🟠',
    low: '🔵'
  };
  
  if (violations.length === 0) {
    return (
      <PanelContainer>
        <PanelHeader severity={null}>
          <h4>
            <span>✅</span> Reglas de Nelson - Sin Violaciones
          </h4>
        </PanelHeader>
      </PanelContainer>
    );
  }
  
  const highestSeverity = getHighestSeverity();
  
  return (
    <PanelContainer>
      <PanelHeader 
        severity={highestSeverity}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4>
          <span>⚠️</span>
          Reglas de Nelson - Violaciones Detectadas
          <span className="badge">{violations.length} regla(s)</span>
        </h4>
        <div className="toggle-icon">{isExpanded ? '▼' : '▲'}</div>
      </PanelHeader>
      
      {isExpanded && (
        <ViolationsList>
          {violations.map((violation, idx) => (
            <ViolationCard key={idx} severity={violation.severity}>
              <div className="violation-title">
                {severityIcons[violation.severity]} {violation.ruleName}
              </div>
              <div className="violation-description">
                {violation.description}
              </div>
              <div className="violation-points">
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>
                  Subgrupos afectados:
                </span>
                {violation.points.map((point, pIdx) => (
                  <span 
                    key={pIdx} 
                    className="point"
                    onClick={() => onPointClick?.(point)}
                    style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                  >
                    {point + 1}
                  </span>
                ))}
              </div>
            </ViolationCard>
          ))}
        </ViolationsList>
      )}
    </PanelContainer>
  );
};

export default AlarmPanel;