import React from 'react';
import styled from 'styled-components';

const SelectorContainer = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1rem 1.5rem;  /* Reducido de 1.5rem a 1rem */
  border: 1px solid var(--border-color);
  margin-bottom: 1.5rem;  /* Reducido de 2rem a 1.5rem */
`;

const Title = styled.h4`
  color: var(--text-primary);
  font-size: 0.75rem;  /* Reducido de 0.875rem */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;  /* Reducido de 1rem */
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;  /* Reducido de 1rem */
  margin-bottom: 0.75rem;  /* Reducido de 1rem */
`;

const OptionCard = styled.div<{ selected: boolean }>`
  background: ${props => props.selected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)'};
  border: 2px solid ${props => props.selected ? 'var(--accent-primary)' : 'var(--border-color)'};
  border-radius: 10px;  /* Reducido de 12px */
  padding: 0.6rem 0.75rem;  /* Reducido de 1rem */
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--accent-primary);
    transform: translateY(-1px);
  }
  
  .option-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;  /* Reducido de 0.5rem */
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;  /* Añadido */
  }
  
  .option-description {
    font-size: 0.7rem;  /* Reducido de 0.75rem */
    color: var(--text-secondary);
    line-height: 1.3;  /* Añadido para mejor legibilidad */
  }
`;

const InfoBox = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;  /* Reducido de 0.75rem */
  margin-top: 0.75rem;  /* Reducido de 1rem */
  font-size: 0.7rem;  /* Reducido de 0.75rem */
  color: var(--text-secondary);
  
  strong {
    color: var(--accent-primary);
  }
`;

interface DataTypeSelectorProps {
  onTypeChange: (type: 'variables' | 'attributes') => void;
  selectedType: 'variables' | 'attributes';
}

const DataTypeSelector: React.FC<DataTypeSelectorProps> = ({ onTypeChange, selectedType }) => {
  return (
    <SelectorContainer>
      <Title>📊 Tipo de Datos</Title>
      <OptionsGrid>
        <OptionCard 
          selected={selectedType === 'variables'}
          onClick={() => onTypeChange('variables')}
        >
          <div className="option-title">
            📏 Datos de Variables (Mediciones)
          </div>
          <div className="option-description">
            Mediciones continuas: peso, longitud, temperatura, voltaje, tiempo, etc.
          </div>
        </OptionCard>
        <OptionCard 
          selected={selectedType === 'attributes'}
          onClick={() => onTypeChange('attributes')}
        >
          <div className="option-title">
            🔢 Datos de Atributos (Conteos)
          </div>
          <div className="option-description">
            Conteos: unidades defectuosas, número de defectos, productos conformes/no conformes.
          </div>
        </OptionCard>
      </OptionsGrid>
      {selectedType === 'attributes' && (
        <InfoBox>
          <strong>📌 Formato esperado para atributos:</strong><br/>
          • Para unidades defectuosas: Subgrupo, Unidades inspeccionadas, Unidades defectuosas<br/>
          • Para defectos por unidad: Subgrupo, Unidades inspeccionadas, Número de defectos
        </InfoBox>
      )}
    </SelectorContainer>
  );
};

export default DataTypeSelector;