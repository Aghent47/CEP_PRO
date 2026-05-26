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
    align-items: center;
    
    .points-label {
      color: var(--text-tertiary);
      font-size: 0.7rem;
    }
    
    .point {
      background: var(--bg-tertiary);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-family: monospace;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #ef4444;
        color: white;
        transform: scale(1.05);
      }
      
      &.already-removed {
        background: #4a4a4a;
        color: #888;
        cursor: not-allowed;
        text-decoration: line-through;
        
        &:hover {
          background: #4a4a4a;
          transform: none;
        }
      }
    }
  }
`;

const SelectAllButton = styled.button`
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface AlarmPanelProps {
  violations: NelsonViolation[];
  onPointClick?: (pointIndex: number) => void;
  onRemovePoints?: (points: number[]) => void;
  chartType?: 'xbar' | 'r';
  removedSubgroups?: number[];  // Añadido: subgrupos ya eliminados
}

const AlarmPanel: React.FC<AlarmPanelProps> = ({ 
  violations, 
  onPointClick, 
  onRemovePoints,
  chartType = 'xbar',
  removedSubgroups = []  // Añadido
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());
  
  const getHighestSeverity = (): 'high' | 'medium' | 'low' | null => {
    if (violations.some(v => v.severity === 'high')) return 'high';
    if (violations.some(v => v.severity === 'medium')) return 'medium';
    if (violations.some(v => v.severity === 'low')) return 'low';
    return null;
  };
  
  const severityIcons = {
    high: '🔴',
    medium: '🟠',
    low: '🔵'
  };
  
  // Obtener todos los puntos afectados por violaciones (solo los no eliminados aún)
  const getAllAffectedPoints = (): number[] => {
    const allPoints: number[] = [];
    violations.forEach(violation => {
      violation.points.forEach(point => {
        // Solo incluir puntos que no hayan sido eliminados
        if (!removedSubgroups.includes(point)) {
          allPoints.push(point);
        }
      });
    });
    return [...new Set(allPoints)];
  };
  
  // Verificar si un punto ya fue eliminado
  const isPointRemoved = (point: number): boolean => {
    return removedSubgroups.includes(point);
  };
  
  // Seleccionar/deseleccionar un punto (solo si no está eliminado)
  const togglePoint = (point: number) => {
    if (isPointRemoved(point)) return;
    
    const newSelected = new Set(selectedPoints);
    if (newSelected.has(point)) {
      newSelected.delete(point);
    } else {
      newSelected.add(point);
    }
    setSelectedPoints(newSelected);
  };
  
  // Seleccionar todos los puntos válidos (no eliminados)
  const selectAllPoints = () => {
    const allPoints = getAllAffectedPoints();
    setSelectedPoints(new Set(allPoints));
  };
  
  // Deseleccionar todos
  const deselectAllPoints = () => {
    setSelectedPoints(new Set());
  };
  
  // Eliminar puntos seleccionados
  const handleRemoveSelected = () => {
    if (selectedPoints.size > 0 && onRemovePoints) {
      const pointsToRemove = Array.from(selectedPoints);
      onRemovePoints(pointsToRemove);
      setSelectedPoints(new Set());
    }
  };
  
  // Manejar clic en un punto individual
  const handlePointClick = (point: number) => {
    if (isPointRemoved(point)) return;
    
    if (onPointClick) {
      onPointClick(point);
    }
    togglePoint(point);
  };
  
  // Filtrar violaciones para mostrar solo las que tienen puntos no eliminados
  const activeViolations = violations.filter(violation => 
    violation.points.some(point => !removedSubgroups.includes(point))
  );
  
  if (activeViolations.length === 0) {
    return (
      <PanelContainer>
        <PanelHeader severity={null}>
          <h4>
            <span>✅</span>
            Reglas de Nelson - Sin Violaciones Activas
          </h4>
        </PanelHeader>
      </PanelContainer>
    );
  }
  
  const highestSeverity = getHighestSeverity();
  const allAffectedPoints = getAllAffectedPoints();
  const hasSelectablePoints = allAffectedPoints.length > 0;
  
  return (
    <PanelContainer>
      <PanelHeader 
        severity={highestSeverity}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4>
          <span>⚠️</span>
          Reglas de Nelson - Violaciones Detectadas ({chartType === 'xbar' ? 'Gráfico X̄' : 'Gráfico R'})
          <span className="badge">{activeViolations.length} regla(s)</span>
        </h4>
        <div className="toggle-icon">{isExpanded ? '▼' : '▲'}</div>
      </PanelHeader>
      
      {isExpanded && (
        <ViolationsList>
          {/* Barra de acciones */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}>
            <SelectAllButton onClick={selectAllPoints} disabled={!hasSelectablePoints}>
              ✓ Seleccionar todos ({allAffectedPoints.length})
            </SelectAllButton>
            <SelectAllButton onClick={deselectAllPoints} disabled={selectedPoints.size === 0}>
              ✗ Deseleccionar todos
            </SelectAllButton>
            <SelectAllButton 
              onClick={handleRemoveSelected}
              disabled={selectedPoints.size === 0}
              style={{ 
                background: selectedPoints.size > 0 ? '#ef4444' : 'var(--bg-tertiary)',
                color: selectedPoints.size > 0 ? 'white' : 'var(--text-tertiary)',
                cursor: selectedPoints.size > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              🗑️ Eliminar seleccionados ({selectedPoints.size})
            </SelectAllButton>
          </div>
          
          {activeViolations.map((violation, idx) => (
            <ViolationCard key={idx} severity={violation.severity}>
              <div className="violation-title">
                {severityIcons[violation.severity]} {violation.ruleName}
              </div>
              <div className="violation-description">
                {violation.description}
              </div>
              <div className="violation-points">
                <span className="points-label">Subgrupos afectados:</span>
                {violation.points.map((point, pIdx) => {
                  const removed = isPointRemoved(point);
                  return (
                    <span 
                      key={pIdx} 
                      className={`point ${removed ? 'already-removed' : ''}`}
                      onClick={() => handlePointClick(point)}
                      style={{
                        background: selectedPoints.has(point) ? '#ef4444' : removed ? '#4a4a4a' : 'var(--bg-tertiary)',
                        color: selectedPoints.has(point) ? 'white' : removed ? '#888' : 'var(--text-primary)'
                      }}
                    >
                      {point + 1} 
                      {selectedPoints.has(point) && ' ✓'}
                      {removed && ' (eliminado)'}
                    </span>
                  );
                })}
              </div>
            </ViolationCard>
          ))}
          
          {/* Mensaje de subgrupos ya eliminados */}
          {removedSubgroups.length > 0 && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.5rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              fontSize: '0.7rem',
              color: '#93c5fd',
              textAlign: 'center'
            }}>
              📌 Subgrupos ya eliminados: {removedSubgroups.map(s => s + 1).join(', ')}
            </div>
          )}
          
          {/* Resumen de selección */}
          {selectedPoints.size > 0 && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#fca5a5',
              textAlign: 'center'
            }}>
              🗑️ {selectedPoints.size} subgrupo(s) seleccionado(s) para eliminar
            </div>
          )}
        </ViolationsList>
      )}
    </PanelContainer>
  );
};

export default AlarmPanel;