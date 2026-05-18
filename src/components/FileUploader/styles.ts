import styled from 'styled-components';

export const UploadContainer = styled.div`
  background: var(--bg-card);
  border: 2px dashed var(--border-color);
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
  backdrop-filter: blur(10px);
  
  &:hover {
    border-color: var(--accent-primary);
    background: var(--bg-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
  }
  
  &.dragging {
    border-color: var(--accent-primary);
    background: rgba(59, 130, 246, 0.05);
    transform: scale(0.98);
  }
`;

export const UploadIcon = styled.div`
  font-size: 3.5rem;
  margin-bottom: 1rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

export const Subtitle = styled.p`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
`;

export const FileInput = styled.input`
  display: none;
`;

export const UploadButton = styled.button`
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  box-shadow: var(--shadow-sm);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const SupportedFormats = styled.div`
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  
  span {
    background: var(--bg-tertiary);
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    margin: 0 0.25rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
`;

export const ErrorMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 0.875rem;
  backdrop-filter: blur(10px);
`;

export const SuccessMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  color: #6ee7b7;
  font-size: 0.875rem;
  backdrop-filter: blur(10px);
`;

export const PreviewTable = styled.div`
  margin-top: 2rem;
  max-width: 100%;
  overflow-x: auto;
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    
    th, td {
      border-bottom: 1px solid var(--border-light);
      padding: 0.75rem;
      text-align: left;
    }
    
    th {
      background: var(--bg-secondary);
      color: var(--accent-primary);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    td {
      color: var(--text-secondary);
      font-family: 'JetBrains Mono', monospace;
    }
    
    tr:hover td {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
  }
`;