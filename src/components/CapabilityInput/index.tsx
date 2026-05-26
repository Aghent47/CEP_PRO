import React, { useState } from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
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

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InputGroup = styled.div`
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
  
  input {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    color: var(--text-primary);
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: var(--accent-primary);
    }
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

const WarningMessage = styled.div`
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #fcd34d;
`;

interface CapabilityInputProps {
  onSpecsChange: (lie: number | null, lse: number | null) => void;
  unit: string;
}

const CapabilityInput: React.FC<CapabilityInputProps> = ({ onSpecsChange, unit }) => {
  const [lie, setLie] = useState<string>('');
  const [lse, setLse] = useState<string>('');

  const handleApply = () => {
    const lieNum = lie ? parseFloat(lie) : null;
    const lseNum = lse ? parseFloat(lse) : null;
    onSpecsChange(lieNum, lseNum);
  };

  return (
    <InputContainer>
      <Title>📏 Límites de Especificación (Voz del Cliente)</Title>
      <InputGrid>
        <InputGroup>
          <label>Límite Inferior (LIE)</label>
          <input
            type="number"
            step="any"
            value={lie}
            onChange={(e) => setLie(e.target.value)}
            placeholder={`Ej: 495 ${unit}`}
          />
        </InputGroup>
        <InputGroup>
          <label>Límite Superior (LSE)</label>
          <input
            type="number"
            step="any"
            value={lse}
            onChange={(e) => setLse(e.target.value)}
            placeholder={`Ej: 505 ${unit}`}
          />
        </InputGroup>
        <InputGroup>
          <label>&nbsp;</label>
          <Button onClick={handleApply}>Aplicar Especificaciones</Button>
        </InputGroup>
      </InputGrid>
      <WarningMessage>
        ℹ️ Los límites de especificación representan la "voz del cliente". Asegúrate de que estos valores reflejen las expectativas y requisitos del cliente para el proceso o producto que estás evaluando.
      </WarningMessage>
    </InputContainer>
  );
};

export default CapabilityInput;