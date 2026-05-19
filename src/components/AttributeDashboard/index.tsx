import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useDataStore } from '../../store/dataStore';
import { parseAttributeData } from '../../utils/attributeParser';
import { calculatePChart, calculateNPChart, calculateCChart, calculateUChart, detectAttributeChartType } from '../../utils/attributeCalculations';
import { detectOutOfControlPoints } from '../../utils/spcCalculations';
import AttributeControlChart from '../AttributeControlChart';

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
  
  select {
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

const AttributeDashboard: React.FC = () => {
  const { data, setAttributeChartData, attributeChartData } = useDataStore();
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'p' | 'np' | 'c' | 'u'>('p');

  useEffect(() => {
    if (data) {
      calculateAttributeChart();
    }
  }, [data, chartType]);

  const calculateAttributeChart = () => {
    if (!data) return;

    try {
      const parsedData = parseAttributeData(data.rawData);
      let chartData;
      
      switch (chartType) {
        case 'p':
          chartData = calculatePChart(parsedData.sampleSizes, parsedData.defects);
          break;
        case 'np':
          chartData = calculateNPChart(parsedData.sampleSizes, parsedData.defects);
          break;
        case 'c':
          chartData = calculateCChart(parsedData.defects);
          break;
        case 'u':
          chartData = calculateUChart(parsedData.sampleSizes, parsedData.defects);
          break;
      }
      
      setAttributeChartData(chartData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular gráfico de atributos');
      setAttributeChartData(null);
    }
  };

  const outOfControlPoints = attributeChartData ? detectOutOfControlPoints(
    attributeChartData.values,
    Math.max(...attributeChartData.ucl),
    Math.min(...attributeChartData.lcl)
  ) : [];

  const totalDefects = attributeChartData?.values.reduce((a, b) => a + b, 0) || 0;
  const avgDefects = attributeChartData ? attributeChartData.centerLine : 0;

  if (!data) return null;

  return (
    <DashboardContainer>
      <ConfigPanel>
        <ConfigGroup>
          <label>Tipo de Gráfico</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value as 'p' | 'np' | 'c' | 'u')}>
            <option value="p">Gráfico p (Proporción de defectuosos)</option>
            <option value="np">Gráfico np (Número de defectuosos)</option>
            <option value="c">Gráfico c (Defectos por unidad)</option>
            <option value="u">Gráfico u (Defectos por unidad variable)</option>
          </select>
        </ConfigGroup>
        <ConfigGroup>
          <label>&nbsp;</label>
          <Button onClick={calculateAttributeChart}>Recalcular</Button>
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
          ❌ {error}
        </div>
      )}

      {attributeChartData && (
        <>
          <StatsGrid>
            <StatCard>
              <div className="label">Línea Central (LC)</div>
              <div className="value">{attributeChartData.centerLine.toFixed(4)}</div>
            </StatCard>
            <StatCard>
              <div className="label">Total de Defectos</div>
              <div className="value">{totalDefects}</div>
            </StatCard>
            <StatCard>
              <div className="label">Promedio por Subgrupo</div>
              <div className="value">{avgDefects.toFixed(2)}</div>
            </StatCard>
            <StatCard>
              <div className="label">Número de Subgrupos</div>
              <div className="value">{attributeChartData.subgroups.length}</div>
            </StatCard>
          </StatsGrid>

          <AttributeControlChart
            title={`Gráfico ${chartType}`}
            chartType={chartType}
            values={attributeChartData.values}
            centerLine={attributeChartData.centerLine}
            ucl={attributeChartData.ucl}
            lcl={attributeChartData.lcl}
            outOfControlPoints={outOfControlPoints}
            sampleSizes={attributeChartData.sampleSizes}
          />
        </>
      )}
    </DashboardContainer>
  );
};

export default AttributeDashboard;