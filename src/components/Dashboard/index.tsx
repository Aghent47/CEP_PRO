import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useDataStore } from '../../store/dataStore';
import { calculateXRChartData, detectOutOfControlPoints } from '../../utils/spcCalculations';
import { calculateXSChartData } from '../../utils/spcCalculationsXS';
import { applyAllNelsonRules, getAllViolationPoints } from '../../utils/nelsonRules';
import { calculateAllCapabilityIndices } from '../../utils/capabilityCalculations';
import type { CapabilityResult } from '../../utils/capabilityCalculations';
import { getRecommendedChartType } from '../../utils/spcConstants';
import ControlChart from '../ControlChart';
import AlarmPanel from '../AlarmPanel';
import CapabilityInput from '../CapabilityInput';
import CapabilityResults from '../CapabilityResults';
import ExecutiveReport from '../ExecutiveReport';
import AdvancedMetrics from '../AdvancedMetrics';
import ProcessHistogram from '../ProcessHistogram';
import NormalityCheck from '../NormalityCheck';

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

const ChartTypeIndicator = styled.div<{ chartType: 'X-R' | 'X-s' | 'Attributes' }>`
  background: ${props => {
    if (props.chartType === 'X-R') return 'rgba(59, 130, 246, 0.2)';
    if (props.chartType === 'X-s') return 'rgba(16, 185, 129, 0.2)';
    return 'rgba(245, 158, 11, 0.2)';
  }};
  border: 1px solid ${props => {
    if (props.chartType === 'X-R') return '#3b82f6';
    if (props.chartType === 'X-s') return '#10b981';
    return '#f59e0b';
  }};
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: ${props => {
    if (props.chartType === 'X-R') return '#3b82f6';
    if (props.chartType === 'X-s') return '#10b981';
    return '#f59e0b';
  }};
  font-weight: 600;
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
  const { 
    data, 
    chartDataXR, 
    chartDataXS,
    setChartDataXR,
    setChartDataXS,
    selectedSubgroupSize, 
    setSelectedSubgroupSize,
    chartType,
    setChartType,
    fileName 
  } = useDataStore();
  
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
  
  // Estado para normalidad
  const [showNormalityCheck, setShowNormalityCheck] = useState<boolean>(true);
  const [normalityPassed, setNormalityPassed] = useState<boolean>(false);
  const [transformedData, setTransformedData] = useState<number[] | null>(null);
  const [transformationLambda, setTransformationLambda] = useState<number | null>(null);
  
  // Estado para capacidad
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

  // Estado para mensajes
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Determinar automáticamente el tipo de gráfico según n
  const determineChartType = useCallback((n: number): 'X-R' | 'X-s' => {
    return getRecommendedChartType(n);
  }, []);

  // Actualizar tipo de gráfico cuando cambia n
  useEffect(() => {
    const recommendedType = determineChartType(selectedSubgroupSize);
    if (recommendedType !== chartType) {
      setChartType(recommendedType);
    }
  }, [selectedSubgroupSize, determineChartType, chartType, setChartType]);

  // Función para aplicar transformación Box-Cox
  const applyBoxCoxTransform = (values: number[], lambda: number): number[] => {
    const minValue = Math.min(...values);
    const offset = minValue <= 0 ? Math.abs(minValue) + 0.01 : 0;
    const positiveData = values.map(v => v + offset);
    
    if (lambda === 0) {
      return positiveData.map(v => Math.log(v));
    }
    return positiveData.map(v => (Math.pow(v, lambda) - 1) / lambda);
  };

  // Manejar decisión después de verificar normalidad
  const handleNormalityDecision = (action: 'continue' | 'transform' | 'empirical' | 'skip') => {
    if (action === 'empirical') {
      setSuccessMessage('📊 Usando límites empíricos basados en percentiles para el análisis.');
      setShowNormalityCheck(false);
      setNormalityPassed(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else if (action === 'skip') {
      setShowNormalityCheck(false);
      setNormalityPassed(true);
    } else {
      setShowNormalityCheck(false);
      setNormalityPassed(true);
    }
  };

  const handleTransform = (lambda: number) => {
    if (!data) return;
    
    const allData: number[] = [];
    data.numericData.forEach(subgroup => {
      allData.push(...subgroup);
    });
    
    const transformed = applyBoxCoxTransform(allData, lambda);
    setTransformedData(transformed);
    setTransformationLambda(lambda);
    setShowNormalityCheck(false);
    setNormalityPassed(true);
    
    setSuccessMessage(`✅ Transformación Box-Cox aplicada (λ=${lambda}). Los datos transformados se usarán para el análisis.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const calculateChart = useCallback(() => {
    if (!data) return;
    
    try {
      let originalSubgroups = data.numericData;
      let subgroups = originalSubgroups;
      
      // Si hay datos transformados, usarlos
      if (transformedData && transformedData.length > 0) {
        // Reorganizar datos transformados en subgrupos
        const subgroupSize = selectedSubgroupSize;
        const numSubgroups = Math.floor(transformedData.length / subgroupSize);
        subgroups = [];
        for (let i = 0; i < numSubgroups; i++) {
          subgroups.push(transformedData.slice(i * subgroupSize, (i + 1) * subgroupSize));
        }
      }
      
      if (phase === 'I' && removedSubgroups.length > 0) {
        subgroups = subgroups.filter((_, idx) => !removedSubgroups.includes(idx));
      }
      
      if (subgroups.length < 2) {
        setError('Se necesitan al menos 2 subgrupos para el análisis');
        setChartDataXR(null);
        setChartDataXS(null);
        return;
      }
      
      const subgroupSizes = subgroups.map(sg => sg.length);
      const minSize = Math.min(...subgroupSizes);
      
      if (selectedSubgroupSize > minSize) {
        setError(`El tamaño de subgrupo seleccionado (${selectedSubgroupSize}) es mayor que el número de mediciones disponibles (${minSize}). Reduce el tamaño.`);
        setChartDataXR(null);
        setChartDataXS(null);
        return;
      }
      
      const trimmedSubgroups = subgroups.map(sg => sg.slice(0, selectedSubgroupSize));
      
      const recommendedType = determineChartType(selectedSubgroupSize);
      
      if (recommendedType === 'X-R') {
        const result = calculateXRChartData(trimmedSubgroups, selectedSubgroupSize);
        setChartDataXR(result);
        setChartDataXS(null);
        
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
        
        if (phase === 'II' && lie !== null && lse !== null && lie < lse) {
          const processMean = result.xbar.centerLine;
          const processSigma = result.r.centerLine / result.constants.d2;
          const indices = calculateAllCapabilityIndices(lie, lse, processMean, processSigma);
          setCapabilityIndices(indices);
        }
      } else {
        const result = calculateXSChartData(trimmedSubgroups, selectedSubgroupSize);
        setChartDataXS(result);
        setChartDataXR(null);
        
        const xbarViolationsList = applyAllNelsonRules(
          result.xbar.values,
          result.xbar.centerLine,
          result.xbar.ucl,
          result.xbar.lcl,
          result.xbar.sigma
        );
        
        const sViolationsList = applyAllNelsonRules(
          result.s.values,
          result.s.centerLine,
          result.s.ucl,
          result.s.lcl,
          result.s.sigma
        );
        
        setXbarViolations(xbarViolationsList);
        setRViolations(sViolationsList);
        
        if (phase === 'II' && lie !== null && lse !== null && lie < lse) {
          const processMean = result.xbar.centerLine;
          const processSigma = result.s.centerLine / result.constants.c4;
          const indices = calculateAllCapabilityIndices(lie, lse, processMean, processSigma);
          setCapabilityIndices(indices);
        }
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular gráficos');
      setChartDataXR(null);
      setChartDataXS(null);
    }
  }, [data, selectedSubgroupSize, phase, removedSubgroups, setChartDataXR, setChartDataXS, lie, lse, determineChartType, transformedData]);

  const handleRemovePoints = useCallback((pointsToRemove: number[]) => {
    if (chartDataXR || chartDataXS) {
      const currentSubgroups = chartDataXR?.subgroups.length || chartDataXS?.subgroups.length || 0;
      const validPoints = pointsToRemove.filter(p => p < currentSubgroups);
      
      if (validPoints.length > 0) {
        setRemovedSubgroups(prev => [...new Set([...prev, ...validPoints])]);
        setSuccessMessage(`${validPoints.length} subgrupo(s) eliminado(s) correctamente. Recalculando límites...`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  }, [chartDataXR, chartDataXS]);

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
    if (data && data.numericData.length > 0 && normalityPassed) {
      calculateChart();
    }
  }, [selectedSubgroupSize, calculateChart, data, chartType, normalityPassed]);

  // Efecto para recalcular cuando cambian los subgrupos removidos
  useEffect(() => {
    if (data && data.numericData.length > 0 && phase === 'I' && normalityPassed) {
      calculateChart();
    }
  }, [removedSubgroups, calculateChart, data, phase, normalityPassed]);

  // Efecto para recalcular capacidad cuando cambian especificaciones
  useEffect(() => {
    if (phase === 'II' && lie !== null && lse !== null && lie < lse && normalityPassed) {
      calculateChart();
    }
  }, [lie, lse, phase, calculateChart, normalityPassed]);

  const xbarOutOfControl = chartDataXR ? detectOutOfControlPoints(
    chartDataXR.xbar.values,
    chartDataXR.xbar.ucl,
    chartDataXR.xbar.lcl
  ) : chartDataXS ? detectOutOfControlPoints(
    chartDataXS.xbar.values,
    chartDataXS.xbar.ucl,
    chartDataXS.xbar.lcl
  ) : [];

  const rOutOfControl = chartDataXR ? detectOutOfControlPoints(
    chartDataXR.r.values,
    chartDataXR.r.ucl,
    chartDataXR.r.lcl
  ) : chartDataXS ? detectOutOfControlPoints(
    chartDataXS.s.values,
    chartDataXS.s.ucl,
    chartDataXS.s.lcl
  ) : [];

  const xbarRuleViolations = xbarViolations.length > 0 ? getAllViolationPoints(xbarViolations) : [];
  const rRuleViolations = rViolations.length > 0 ? getAllViolationPoints(rViolations) : [];

  const calculateProcessSigma = (): string => {
    if (chartDataXR) {
      const sigma = chartDataXR.r.centerLine / chartDataXR.constants.d2;
      return sigma.toFixed(4);
    }
    if (chartDataXS) {
      const sigma = chartDataXS.s.centerLine / chartDataXS.constants.c4;
      return sigma.toFixed(4);
    }
    return '0';
  };

  const handleRemoveOutOfControl = () => {
    const problematicPoints = [...new Set([...xbarOutOfControl, ...rOutOfControl, ...xbarRuleViolations, ...rRuleViolations])];
    if (problematicPoints.length > 0) {
      setRemovedSubgroups(prev => [...new Set([...prev, ...problematicPoints])]);
      setSuccessMessage(`${problematicPoints.length} punto(s) problemático(s) eliminado(s). Recalculando...`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleResetCleaning = () => {
    setRemovedSubgroups([]);
    setSuccessMessage('Datos restablecidos a su estado original.');
    setTimeout(() => setSuccessMessage(null), 3000);
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

  const currentChartData = chartDataXR || chartDataXS;
  const isXRRChart = chartType === 'X-R';

  // Extraer todos los datos para la prueba de normalidad
  const getAllDataForNormality = (): number[] => {
    const allData: number[] = [];
    if (transformedData && transformedData.length > 0) {
      return transformedData;
    }
    data.numericData.forEach(subgroup => {
      subgroup.forEach(value => {
        allData.push(value);
      });
    });
    return allData;
  };

  // Si aún no se ha verificado la normalidad, mostrar el componente
  if (showNormalityCheck) {
    return (
      <DashboardContainer>
        <NormalityCheck
          data={getAllDataForNormality()}
          onProceed={handleNormalityDecision}
          onTransform={handleTransform}
        />
      </DashboardContainer>
    );
  }

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
            <option value="I">Fase I - Estabilización</option>
            <option value="II">Fase II - Capacidad y Monitoreo</option>
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
          {transformationLambda !== null && (
            <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.25rem' }}>
              ✅ Datos transformados con Box-Cox (λ={transformationLambda})
            </div>
          )}
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
          <label>Tipo de Gráfico (Automático)</label>
          <ChartTypeIndicator chartType={chartType}>
            📊 {chartType === 'X-R' && 'Gráfico X-R (Medias y Rangos)'}
            {chartType === 'X-s' && 'Gráfico X-s (Medias y Desviación Estándar)'}
            {chartType === 'Attributes' && 'Gráfico de Atributos (p, np, c, u)'}
            <br />
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
              {chartType === 'X-R' && '✓ Recomendado para n ≤ 9'}
              {chartType === 'X-s' && '✓ Recomendado para n ≥ 10'}
              {chartType === 'Attributes' && '✓ Para datos de conteo (defectos)'}
            </span>
          </ChartTypeIndicator>
        </ConfigGroup>
        <ConfigGroup>
          <label>&nbsp;</label>
          <Button onClick={calculateChart}>Recalcular</Button>
        </ConfigGroup>
      </ConfigPanel>

      {successMessage && (
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#6ee7b7'
        }}>
          ✅ {successMessage}
        </div>
      )}

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
              Eliminar todos los puntos problemáticos
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
          <AlarmPanel 
            violations={xbarViolations} 
            onPointClick={(point) => console.log('Punto clickeado:', point)}
            onRemovePoints={handleRemovePoints}
            chartType="xbar"
            removedSubgroups={removedSubgroups}
          />
          <AlarmPanel 
            violations={rViolations}
            onPointClick={(point) => console.log('Punto clickeado:', point)}
            onRemovePoints={handleRemovePoints}
            chartType="r"
            removedSubgroups={removedSubgroups}
          />
        </>
      )}

      {phase === 'II' && currentChartData && hasSpecs && (
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

      {phase === 'II' && currentChartData && (
        <ExecutiveReport
          fileName={fileName || 'Sin nombre'}
          chartData={currentChartData}
          capabilityIndices={capabilityIndices}
          unit={unit}
          lie={lie}
          lse={lse}
          xbarViolations={xbarViolations}
          rViolations={rViolations}
          removedSubgroups={removedSubgroups}
          originalSubgroupsCount={data?.numericData.length || 0}
          chartType={chartType as 'X-R' | 'X-s'} 
        />
      )}

      {phase === 'II' && currentChartData && (
        <AdvancedMetrics 
          currentN={selectedSubgroupSize} 
          currentSamplingTime={1}
        />
      )}

      {currentChartData && (
        <>
          <StatsGrid>
            <StatCard>
              <div className="label">Media del Proceso (X̄̄)</div>
              <div className="value">{currentChartData.xbar.centerLine.toFixed(4)}</div>
              <span className="unit">{unit}</span>
            </StatCard>
            <StatCard>
              <div className="label">{isXRRChart ? 'Rango Promedio (R̄)' : 's Promedio (s̄)'}</div>
              <div className="value">{isXRRChart ? chartDataXR!.r.centerLine.toFixed(4) : chartDataXS!.s.centerLine.toFixed(4)}</div>
              <span className="unit">{unit}</span>
            </StatCard>
            <StatCard>
              <div className="label">Sigma del Proceso</div>
              <div className="value">{calculateProcessSigma()}</div>
              <span className="unit">{unit}</span>
            </StatCard>
            <StatCard>
              <div className="label">Subgrupos Activos</div>
              <div className="value">{currentChartData.subgroups.length}</div>
              <span className="unit">de {data.numericData.length}</span>
            </StatCard>
          </StatsGrid>

          {isXRRChart && chartDataXR && (
            <>
              <ControlChart
                title="Carta X̄ (Gráfico de Medias)"
                values={chartDataXR.xbar.values}
                centerLine={chartDataXR.xbar.centerLine}
                ucl={chartDataXR.xbar.ucl}
                lcl={chartDataXR.xbar.lcl}
                outOfControlPoints={xbarOutOfControl}
                ruleViolationPoints={xbarRuleViolations}
                unit={unit}
                onPointClick={(point) => console.log('Clic en punto:', point)}
              />
              <ControlChart
                title="Carta R (Gráfico de Rangos)"
                values={chartDataXR.r.values}
                centerLine={chartDataXR.r.centerLine}
                ucl={chartDataXR.r.ucl}
                lcl={chartDataXR.r.lcl}
                outOfControlPoints={rOutOfControl}
                ruleViolationPoints={rRuleViolations}
                unit={unit}
                onPointClick={(point) => console.log('Clic en punto:', point)}
              />
            </>
          )}

          {!isXRRChart && chartDataXS && (
            <>
              <ControlChart
                title="Carta X̄ (Gráfico de Medias)"
                values={chartDataXS.xbar.values}
                centerLine={chartDataXS.xbar.centerLine}
                ucl={chartDataXS.xbar.ucl}
                lcl={chartDataXS.xbar.lcl}
                outOfControlPoints={xbarOutOfControl}
                ruleViolationPoints={xbarRuleViolations}
                unit={unit}
                onPointClick={(point) => console.log('Clic en punto:', point)}
              />
              <ControlChart
                title="Carta s (Gráfico de Desviación Estándar)"
                values={chartDataXS.s.values}
                centerLine={chartDataXS.s.centerLine}
                ucl={chartDataXS.s.ucl}
                lcl={chartDataXS.s.lcl}
                outOfControlPoints={rOutOfControl}
                ruleViolationPoints={rRuleViolations}
                unit={unit}
                onPointClick={(point) => console.log('Clic en punto:', point)}
              />
            </>
          )}

         {phase === 'II' && currentChartData && (
      <ProcessHistogram
        data={(() => {
          if (!data) return [];
          const allData: number[] = [];
          data.numericData.forEach(subgroup => {
            subgroup.forEach(value => {
              allData.push(value);
            });
          });
          return allData;
        })()}
        mean={currentChartData.xbar.centerLine}
        sigma={parseFloat(calculateProcessSigma())}
        lie={lie}
        lse={lse}
        target={lie !== null && lse !== null ? (lie + lse) / 2 : null}
        unit={unit}
        title="Distribución del Proceso vs Especificaciones"
      />
    )}

        </>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;