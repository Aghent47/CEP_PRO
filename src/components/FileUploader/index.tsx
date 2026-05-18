import React, { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent, MouseEvent } from 'react';
import { useDataStore } from '../../store/dataStore';
import { parseExcelOrCSV } from '../../utils/fileParser';
import {
  UploadContainer,
  UploadIcon,
  Title,
  Subtitle,
  FileInput,
  UploadButton,
  SupportedFormats,
  ErrorMessage,
  SuccessMessage,
  PreviewTable
} from './styles';

const FileUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setData, setLoading, setError, data, fileName, error, isLoading } = useDataStore();
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFile = async (file: File): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const parsedData = await parseExcelOrCSV(file);
      setData(parsedData, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
        handleFile(file);
      } else {
        setError('Formato no soportado. Use .xlsx, .xls o .csv');
      }
    }
  };

  const handleClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleButtonClick = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    handleClick();
  };

  const renderPreview = (): React.ReactNode => {
    if (!data) return null;
    
    const previewData = data.rawData.slice(0, 6);
    const hasMoreRows = data.rawData.length > 6;
    
    return (
      <PreviewTable>
        <table>
          <thead>
            <tr>
              {data.columnNames.map((col: string, idx: number) => (
                <th key={idx}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row: (string | number | boolean | null | undefined)[], rowIdx: number) => (
              <tr key={rowIdx}>
                {row.map((cell: string | number | boolean | null | undefined, cellIdx: number) => (
                  <td key={cellIdx}>{cell !== undefined && cell !== "" && cell !== null ? String(cell) : "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {hasMoreRows && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ... y {data.rawData.length - 6} filas más
          </div>
        )}
      </PreviewTable>
    );
  };

  return (
    <div>
      <UploadContainer
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={isDragging ? 'dragging' : ''}
      >
        <UploadIcon>📄</UploadIcon>
        <Title>Cargar datos de producción</Title>
        <Subtitle>Arrastra y suelta o haz clic para seleccionar</Subtitle>
        <FileInput
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          disabled={isLoading}
        />
        <UploadButton as="div" onClick={handleButtonClick}>
          {isLoading ? 'Procesando...' : 'Seleccionar archivo'}
        </UploadButton>
        <SupportedFormats>
          Formatos soportados: <span>.xlsx</span> <span>.xls</span> <span>.csv</span> | Máx: 50MB
        </SupportedFormats>
      </UploadContainer>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
     
        {data && !error && (
          <SuccessMessage>
            ✅ Archivo "{fileName}" cargado correctamente!<br/>
            📊 {data.columnNames.length - 1} columnas de mediciones | 📋 {data.numericData[0]?.length || 0} mediciones por subgrupo | 🔢 {data.numericData.length} subgrupos
          </SuccessMessage>
        )}
      
      {renderPreview()}
    </div>
  );
};

export default FileUploader;