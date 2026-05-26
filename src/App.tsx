import React from 'react';
import styled from 'styled-components';
import FileUploader from './components/FileUploader';
import Dashboard from './components/Dashboard';
import AttributeDashboard from './components/AttributeDashboard';
import DataTypeSelector from './components/DataTypeSelector';
import { useDataStore } from './store/dataStore';
import logo from './assets/logo.png';

const AppContainer = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
`;

const Header = styled.header`
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  img {
    height: 50px;
    width: auto;
    object-fit: contain;
  }
`;

const TitleContainer = styled.div`
  h1 {
    font-size: 1.25rem;
    font-weight: 600;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;
    margin: 0;
  }
  
  p {
    color: var(--text-secondary);
    font-size: 0.75rem;
    margin-top: 0.25rem;
    margin-bottom: 0;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const App: React.FC = () => {
  const { data, dataType, setDataType } = useDataStore();

  return (
    <AppContainer>
      <Header>
        <LogoContainer>
          <img src={logo} alt="Logo" />
          <TitleContainer>
            <h1>QUALITY CORE</h1>
            <p>Statistical Process Control Software</p>
          </TitleContainer>
        </LogoContainer>
      </Header>
      
      <Container>
        <DataTypeSelector 
          onTypeChange={setDataType}
          selectedType={dataType}
        />
        <FileUploader />
        {data && dataType === 'variables' && <Dashboard />}
        {data && dataType === 'attributes' && <AttributeDashboard />}
      </Container>
    </AppContainer>
  );
};

export default App;