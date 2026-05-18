import React from 'react';
import styled from 'styled-components';
import FileUploader from './components/FileUploader';
import { useDataStore } from './store/dataStore';

const AppContainer = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
`;

const Header = styled.header`
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;
  }
  
  p {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Content = styled.main`
  // Sin estilos adicionales por ahora
`;

const DataSummary = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
  
  h3 {
    margin-bottom: 1rem;
    color: var(--accent-primary);
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    
    .stat {
      .label {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }
      
      .value {
        font-size: 2rem;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        background: var(--gradient-dark);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }
  }
`;

const App: React.FC = () => {
  const { data } = useDataStore();

  return (
    <AppContainer>
      <Header>
        <h1>Panel de control de calidad PCS </h1>
        <p>Control estadístico de procesos | Monitorización en tiempo real</p>
      </Header>
      
      <Container>
        <Content>
          <FileUploader />
          
          {data && (
            <DataSummary>
              <h3>📊 Data Overview</h3>
              <div className="stats">
                <div className="stat">
                  <div className="label">Process Variables</div>
                  <div className="value">{data.columnNames.length}</div>
                </div>
                <div className="stat">
                  <div className="label">Subgroups</div>
                  <div className="value">{data.numericData[0]?.length || 0}</div>
                </div>
                <div className="stat">
                  <div className="label">Total Measurements</div>
                  <div className="value">
                    {data.numericData.reduce((total: number, column: number[]) => total + column.length, 0)}
                  </div>
                </div>
              </div>
            </DataSummary>
          )}
        </Content>
      </Container>
    </AppContainer>
  );
};

export default App;