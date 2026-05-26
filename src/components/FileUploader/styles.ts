import styled from 'styled-components';

export const UploadContainer = styled.div`
  background: var(--bg-card);
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  padding: 1.5rem 1rem;
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
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
`;

export const Subtitle = styled.p`
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
`;

export const FileInput = styled.input`
  display: none;
`;

export const UploadButton = styled.button`
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
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
  margin-top: 0.75rem;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  
  span {
    background: var(--bg-tertiary);
    padding: 0.2rem 0.6rem;
    border-radius: 5px;
    margin: 0 0.2rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--text-secondary);
  }
`;

export const ErrorMessage = styled.div`
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 0.8rem;
  backdrop-filter: blur(10px);
`;

export const SuccessMessage = styled.div`
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  color: #6ee7b7;
  font-size: 0.8rem;
  backdrop-filter: blur(10px);
`;

export const PreviewTable = styled.div`
  margin-top: 1.5rem;
  max-width: 100%;
  overflow-x: auto;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
    
    th, td {
      border-bottom: 1px solid var(--border-light);
      padding: 0.5rem;
      text-align: left;
    }
    
    th {
      background: var(--bg-secondary);
      color: var(--accent-primary);
      font-weight: 600;
      font-size: 0.7rem;
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