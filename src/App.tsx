import React from 'react';
import styled from 'styled-components';
import FileUploader from './components/FileUploader';
import Dashboard from './components/Dashboard'; // ← Esta importación debería funcionar ahora
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

const App: React.FC = () => {
  const { data } = useDataStore();

  return (
    <AppContainer>
      <Header>
        <h1>Panel de control SPC</h1>
        <p>Control Estadístico de Procesos | Monitoreo en tiempo real</p>
      </Header>
      
      <Container>
        <FileUploader />
        {data && <Dashboard />}
      </Container>
    </AppContainer>
  );
};

export default App;