import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useDataStore } from '../../store/dataStore';
import { calculateXRChartData, detectOutOfControlPoints } from '../../utils/spcCalculations';
import { applyAllNelsonRules, getAllViolationPoints } from '../../utils/nelsonRules';
import { calculateAllCapabilityIndices } from '../../utils/capabilityCalculations';
import type { CapabilityResult } from '../../utils/capabilityCalculations';
import ControlChart from '../ControlChart';
import AlarmPanel from '../AlarmPanel';
import CapabilityInput from '../CapabilityInput';
import CapabilityResults from '../CapabilityResults';

// ============ ESTILOS ============
const DashboardContainer = styled.div`
  margin-top: 2rem;
`;

const ConfigPanel = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const ConfigGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  
  select, input {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    color: var(--text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    min-width: 200px;
    
    &:hover {
      border-color: var(--accent-primary);
    }
    
    &:focus {
      outline: none;
      border-color: var(--accent-primary);
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  
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
`;

const Button = styled.button`
  background: var(--gradient-primary);
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

const CleaningPanel = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  
  .info {
    color: var(--text-secondary);
    font-size: 0.875rem;
    
    strong {
      color: var(--accent-primary);
    }
  }
`;

const CleaningButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  background: ${props => props.variant === 'danger' ? '#ef4444' : 'var(--gradient-primary)'};
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
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

// ============ COMPONENTE PRINCIPAL ============
const Dashboard: React.FC = () => {
  const { data, chartData, setChartData, selectedSubgroupSize, setSelectedSubgroupSize } = useDataStore();
  const [error, setError] = useState<string | null>(null);
  const [actualSubgroupSize, setActualSubgroupSize] = useState<number>(0);
  const [unit, setUnit] = useState<string>("mm");
  const [xbarViolations, setXbarViolations] = useState<any[]>([]);
  const [rViolations, setRViolations] = useState<any[]>([]);
  const [phase, setPhase] = useState<'I' | 'II'>('I');
  const [removedSubgroups, setRemovedSubgroups] = useState<number[]>([]);
  
  // Estado para límites de especificación
  const [lie, setLie] = useState<number | null>(null);
  const [lse, setLse] = useState<number | null>(null);
  
  // Estado para capacidad - usando el tipo CapabilityResult
  const [capabilityIndices, setCapabilityIndices] = useState<CapabilityResult>({
    cp: null,
    cpk: null,
    cpl: null,
    cpu: null,
    k: null,
    ppm: null,
    sigmaLevel: null,
    ppmLower: null,
    ppmUpper: null,
    pncPercent: null
  });

  const calculateChart = useCallback(() => {
    if (!data) return;
    
    try {
      let originalSubgroups = data.numericData;
      let subgroups = originalSubgroups;
      
      if (phase === 'I' && removedSubgroups.length > 0) {
        subgroups = originalSubgroups.filter((_, idx) => !removedSubgroups.includes(idx));
      }
      
      if (subgroups.length < 2) {
        setError('Se necesitan al menos 2 subgrupos para el análisis');
        setChartData(null);
        return;
      }
      
      const subgroupSizes = subgroups.map(sg => sg.length);
      const minSize = Math.min(...subgroupSizes);
      
      if (selectedSubgroupSize > minSize) {
        setError(`El tamaño de subgrupo seleccionado (${selectedSubgroupSize}) es mayor que el número de mediciones disponibles (${minSize}). Reduce el tamaño.`);
        setChartData(null);
        return;
      }
      
      const trimmedSubgroups = subgroups.map(sg => sg.slice(0, selectedSubgroupSize));
      const result = calculateXRChartData(trimmedSubgroups, selectedSubgroupSize);
      setChartData(result);
      
      const xbarViolationsList = applyAllNelsonRules(
        result.xbar.values,
        result.xbar.centerLine,
        result.xbar.ucl,
        result.xbar.lcl,
        result.xbar.sigma
      );
      
      const rViolationsList = applyAllNelsonRules(
        result.r.values,
        result.r.centerLine,
        result.r.ucl,
        result.r.lcl,
        result.r.sigma
      );
      
      setXbarViolations(xbarViolationsList);
      setRViolations(rViolationsList);
      
      // Calcular índices de capacidad (Fase II)
      if (phase === 'II' && lie !== null && lse !== null && lie < lse) {
        const processMean = result.xbar.centerLine;
        const processSigma = result.r.centerLine / result.constants.d2;
        const indices = calculateAllCapabilityIndices(lie, lse, processMean, processSigma);
        setCapabilityIndices(indices);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular gráficos');
      setChartData(null);
    }
  }, [data, selectedSubgroupSize, phase, removedSubgroups, setChartData, lie, lse]);

  // Efecto para detectar el tamaño real
  useEffect(() => {
    if (data && data.numericData.length > 0) {
      const firstSubgroup = data.numericData[0];
      if (firstSubgroup) {
        const detectedSize = firstSubgroup.length;
        setActualSubgroupSize(detectedSize);
        if (detectedSize < selectedSubgroupSize) {
          setSelectedSubgroupSize(detectedSize);
        }
      }
    }
  }, [data]);

  // Efecto para recalcular cuando cambia el tamaño
  useEffect(() => {
    if (data && data.numericData.length > 0) {
      calculateChart();
    }
  }, [selectedSubgroupSize, calculateChart, data]);

  // Efecto para recalcular cuando cambian los subgrupos removidos (Fase I)
  useEffect(() => {
    if (data && data.numericData.length > 0 && phase === 'I') {
      calculateChart();
    }
  }, [removedSubgroups, calculateChart, data, phase]);

  // Efecto para recalcular capacidad cuando cambian especificaciones
  useEffect(() => {
    if (phase === 'II' && chartData && lie !== null && lse !== null && lie < lse) {
      const processMean = chartData.xbar.centerLine;
      const processSigma = chartData.r.centerLine / chartData.constants.d2;
      const indices = calculateAllCapabilityIndices(lie, lse, processMean, processSigma);
      setCapabilityIndices(indices);
    }
  }, [lie, lse, phase, chartData]);

  const xbarOutOfControl = chartData ? detectOutOfControlPoints(
    chartData.xbar.values,
    chartData.xbar.ucl,
    chartData.xbar.lcl
  ) : [];

  const rOutOfControl = chartData ? detectOutOfControlPoints(
    chartData.r.values,
    chartData.r.ucl,
    chartData.r.lcl
  ) : [];

  const xbarRuleViolations = xbarViolations.length > 0 ? getAllViolationPoints(xbarViolations) : [];
  const rRuleViolations = rViolations.length > 0 ? getAllViolationPoints(rViolations) : [];

  const calculateProcessSigma = (): string => {
    if (!chartData) return '0';
    const sigma = chartData.r.centerLine / chartData.constants.d2;
    return sigma.toFixed(4);
  };

  const handleRemoveOutOfControl = () => {
    const problematicPoints = [...new Set([...xbarOutOfControl, ...rOutOfControl, ...xbarRuleViolations, ...rRuleViolations])];
    if (problematicPoints.length > 0) {
      setRemovedSubgroups(prev => [...new Set([...prev, ...problematicPoints])]);
    }
  };

  const handleResetCleaning = () => {
    setRemovedSubgroups([]);
  };

  const handleSubgroupSizeChange = (newSize: number) => {
    setSelectedSubgroupSize(newSize);
    if (phase === 'I' && removedSubgroups.length > 0) {
      setRemovedSubgroups([]);
    }
  };

  const handleSpecsChange = (newLie: number | null, newLse: number | null) => {
    setLie(newLie);
    setLse(newLse);
  };

  const hasViolations = xbarViolations.length > 0 || rViolations.length > 0;
  const totalOutOfControl = xbarOutOfControl.length + rOutOfControl.length;
  const totalViolations = xbarRuleViolations.length + rRuleViolations.length;
  
  const hasSpecs = lie !== null && lse !== null && lie < lse;

  const availableSizes = [];
  for (let i = 2; i <= Math.min(25, actualSubgroupSize); i++) {
    availableSizes.push(i);
  }

  if (!data) return null;

  return (
    <DashboardContainer>
      <ConfigPanel>
        <ConfigGroup>
          <label>Fase de Análisis</label>
          <select value={phase} onChange={(e) => {
            setPhase(e.target.value as 'I' | 'II');
            if (e.target.value === 'I' && removedSubgroups.length > 0) {
              setRemovedSubgroups([]);
            }
          }}>
            <option value="I">Fase I - Estabilización (Limpieza de datos)</option>
            <option value="II">Fase II - Monitoreo y Capacidad</option>
          </select>
        </ConfigGroup>
        <ConfigGroup>
          <label>Tamaño del Subgrupo (n)</label>
          {actualSubgroupSize > 0 && actualSubgroupSize !== selectedSubgroupSize && (
            <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginBottom: '0.25rem' }}>
              ⚠️ Datos tienen {actualSubgroupSize} mediciones. Usando primeras {selectedSubgroupSize}
            </div>
          )}
          <select 
            value={selectedSubgroupSize}
            onChange={(e) => handleSubgroupSizeChange(Number(e.target.value))}
          >
            {availableSizes.map(n => (
              <option key={n} value={n}>n = {n} mediciones</option>
            ))}
          </select>
        </ConfigGroup>
        <ConfigGroup>
          <label>Unidad de Medida</label>
          <input 
            type="text" 
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Ej: mm, cm, kg, °C"
          />
        </ConfigGroup>
        <ConfigGroup>
          <label>&nbsp;</label>
          <Button onClick={calculateChart}>Recalcular</Button>
        </ConfigGroup>
      </ConfigPanel>

      {phase === 'I' && (
        <CleaningPanel>
          <div className="info">
            {removedSubgroups.length > 0 ? (
              <>🗑️ Subgrupos removidos: <strong>{removedSubgroups.map(i => i + 1).join(', ')}</strong></>
            ) : (
              <>📊 {totalOutOfControl > 0 || totalViolations > 0 ? 
                `Se detectaron ${totalOutOfControl + totalViolations} puntos problemáticos` : 
                '✅ Proceso estable - No se detectaron problemas'}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <CleaningButton 
              onClick={handleRemoveOutOfControl}
              disabled={!(totalOutOfControl > 0 || totalViolations > 0)}
              variant="danger"
            >
              Eliminar puntos problemáticos
            </CleaningButton>
            <CleaningButton onClick={handleResetCleaning} disabled={removedSubgroups.length === 0}>
              Restablecer datos originales
            </CleaningButton>
          </div>
        </CleaningPanel>
      )}

      {phase === 'II' && (
        <CapabilityInput onSpecsChange={handleSpecsChange} unit={unit} />
      )}

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#fca5a5'
        }}>
          ❌ {error}
        </div>
      )}

      {hasViolations && phase === 'I' && (
        <>
          <AlarmPanel violations={xbarViolations} />
          <AlarmPanel violations={rViolations} />
        </>
      )}

      {phase === 'II' && chartData && hasSpecs && (
        <CapabilityResults
          cp={capabilityIndices.cp}
          cpk={capabilityIndices.cpk}
          cpl={capabilityIndices.cpl}
          cpu={capabilityIndices.cpu}
          k={capabilityIndices.k}
          ppm={capabilityIndices.ppm}
          sigmaLevel={capabilityIndices.sigmaLevel}
          isStable={true}
          hasSpecs={hasSpecs}
        />
      )}

      {chartData && (
        <>
          <StatsGrid>
            <StatCard>
              <div className="label">Gran Media (X̄̄)</div>
              <div className="value">{chartData.xbar.centerLine.toFixed(4)}</div>
              <span className="unit">{unit}</span>
            </StatCard>
            <StatCard>
              <div className="label">Rango Promedio (R̄)</div>
              <div className="value">{chartData.r.centerLine.toFixed(4)}</div>
              <span className="unit">{unit}</span>
            </StatCard>
            <StatCard>
              <div className="label">Sigma del Proceso</div>
              <div className="value">{calculateProcessSigma()}</div>
              <span className="unit">{unit}</span>
            </StatCard>
            <StatCard>
              <div className="label">Subgrupos Activos</div>
              <div className="value">{chartData.subgroups.length}</div>
              <span className="unit">de {data.numericData.length}</span>
            </StatCard>
          </StatsGrid>

          <ControlChart
            title="Carta X̄ (Gráfico de Medias)"
            values={chartData.xbar.values}
            centerLine={chartData.xbar.centerLine}
            ucl={chartData.xbar.ucl}
            lcl={chartData.xbar.lcl}
            outOfControlPoints={xbarOutOfControl}
            ruleViolationPoints={xbarRuleViolations}
            unit={unit}
          />

          <ControlChart
            title="Carta R (Gráfico de Rangos)"
            values={chartData.r.values}
            centerLine={chartData.r.centerLine}
            ucl={chartData.r.ucl}
            lcl={chartData.r.lcl}
            outOfControlPoints={rOutOfControl}
            ruleViolationPoints={rRuleViolations}
            unit={unit}
          />
        </>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;