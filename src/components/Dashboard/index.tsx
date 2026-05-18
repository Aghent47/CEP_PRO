import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useDataStore } from '../../store/dataStore';
import { calculateXRChartData, detectOutOfControlPoints } from '../../utils/spcCalculations';
import ControlChart from '../ControlChart';

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

const Dashboard: React.FC = () => {
  const { data, chartData, setChartData, selectedSubgroupSize, setSelectedSubgroupSize } = useDataStore();
  const [error, setError] = useState<string | null>(null);
  const [actualSubgroupSize, setActualSubgroupSize] = useState<number>(0);

  useEffect(() => {
    if (data && data.numericData.length > 0) {
      // Detectar automáticamente el tamaño del subgrupo basado en la primera fila
      const firstSubgroup = data.numericData[0];
      if (firstSubgroup) {
        const detectedSize = firstSubgroup.length;
        setActualSubgroupSize(detectedSize);
        // Actualizar el tamaño seleccionado al detectado
        if (detectedSize !== selectedSubgroupSize) {
          setSelectedSubgroupSize(detectedSize);
        }
      }
      calculateChart();
    }
  }, [data]);

  const calculateChart = () => {
    if (!data) return;
    
    try {
      // data.numericData ya es un array de subgrupos, cada uno con sus mediciones
      const subgroups = data.numericData;
      
      // Verificar que todos los subgrupos tienen el mismo tamaño
      const subgroupSizes = subgroups.map(sg => sg.length);
      const uniqueSizes = [...new Set(subgroupSizes)];
      
      if (uniqueSizes.length > 1) {
        setError(`Los subgrupos tienen tamaños diferentes: ${uniqueSizes.join(', ')}. Todos deben tener el mismo número de mediciones.`);
        setChartData(null);
        return;
      }
      
      const actualSize = uniqueSizes[0];
      if (actualSize !== selectedSubgroupSize) {
        setSelectedSubgroupSize(actualSize);
      }
      
      const result = calculateXRChartData(subgroups, actualSize);
      setChartData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular gráficos');
      setChartData(null);
    }
  };

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

  const calculateProcessSigma = (): string => {
    if (!chartData) return '0';
    if (chartData.constants && 'd2' in chartData.constants) {
      const sigma = chartData.r.centerLine / chartData.constants.d2;
      return sigma.toFixed(4);
    }
    return '0';
  };

  if (!data) return null;

  return (
    <DashboardContainer>
      <ConfigPanel>
        <ConfigGroup>
          <label>Tamaño del subgrupo (n)</label>
          <select 
            value={selectedSubgroupSize}
            onChange={(e) => setSelectedSubgroupSize(Number(e.target.value))}
          >
            {[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25].map(n => (
              <option key={n} value={n}>n = {n}</option>
            ))}
          </select>
        </ConfigGroup>
        {actualSubgroupSize > 0 && actualSubgroupSize !== selectedSubgroupSize && (
          <ConfigGroup>
            <label>Tamaño detectado</label>
            <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.875rem' }}>
              {actualSubgroupSize} mediciones por subgrupo
            </div>
          </ConfigGroup>
        )}
        <ConfigGroup>
          <label>&nbsp;</label>
          <Button onClick={calculateChart}>Recalcular</Button>
        </ConfigGroup>
      </ConfigPanel>

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#fca5a5'
        }}>
          {error}
        </div>
      )}

      {chartData && (
        <>
          <StatsGrid>
            <StatCard>
              <div className="label">Media general (X̄̄)</div>
              <div className="value">{chartData.xbar.centerLine.toFixed(4)}</div>
            </StatCard>
            <StatCard>
              <div className="label">Rango promedio (R̄)</div>
              <div className="value">{chartData.r.centerLine.toFixed(4)}</div>
            </StatCard>
            <StatCard>
              <div className="label">Sigma del proceso</div>
              <div className="value">{calculateProcessSigma()}</div>
            </StatCard>
            <StatCard>
              <div className="label">Subgrupos</div>
              <div className="value">{chartData.subgroups.length}</div>
            </StatCard>
          </StatsGrid>

          <ControlChart
            title="Carta X̄ (Gráfico de medias)"
            values={chartData.xbar.values}
            centerLine={chartData.xbar.centerLine}
            ucl={chartData.xbar.ucl}
            lcl={chartData.xbar.lcl}
            outOfControlPoints={xbarOutOfControl}
          />

          <ControlChart
            title="Carta R (Gráfico de rangos)"
            values={chartData.r.values}
            centerLine={chartData.r.centerLine}
            ucl={chartData.r.ucl}
            lcl={chartData.r.lcl}
            outOfControlPoints={rOutOfControl}
          />
        </>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;