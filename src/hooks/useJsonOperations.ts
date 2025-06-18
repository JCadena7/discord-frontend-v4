import { useCallback, useState } from 'react';
// Remove Category import if categories prop is only for reference or if getServerData is solely used for export
// import { Category } from '../types/discord';
import { ServerStructureData } from '../types/discord'; // Import the main data structure type

// Basic validation for ServerStructureData
const isValidServerStructureData = (data: any): data is ServerStructureData => {
  return data && typeof data.serverId === 'string' && Array.isArray(data.items) && Array.isArray(data.roles);
};

interface UseJsonOperationsProps {
  // categories: Category[]; // DndCategory[] - for reference if needed by toBackend (now removed)
  setCategories: (data: ServerStructureData) => void; // This is applyJsonToStore
  showNotification: (message: string, type?: 'success' | 'error') => void;
  // toBackend?: (categories: Category[]) => any; // Removed
  // fromBackend?: (data: any) => Category[]; // Removed
  getServerData: () => ServerStructureData | null; // To get raw data for export
}

export const useJsonOperations = ({
  setCategories, // This is applyJsonToStore
  showNotification,
  getServerData,
}: UseJsonOperationsProps) => {
  const [jsonInput, setJsonInput] = useState<string>('');

  const copyToClipboard = useCallback(async (): Promise<void> => {
    try {
      const dataToCopy = getServerData();
      if (!dataToCopy) {
        showNotification('No data available to copy.', 'error');
        return;
      }
      const jsonString = JSON.stringify(dataToCopy, null, 2);
      await navigator.clipboard.writeText(jsonString);
      showNotification('¡JSON copiado al portapapeles!');
    } catch (err) {
      showNotification('Error al copiar JSON', 'error');
    }
  }, [getServerData, showNotification]);

  const pasteFromClipboard = useCallback(async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      const parsedData = JSON.parse(text);
      if (isValidServerStructureData(parsedData)) {
        setCategories(parsedData); // Calls applyJsonToStore
        showNotification('¡JSON importado correctamente!');
      } else {
        showNotification('La estructura del JSON no es válida. Expected ServerStructureData.', 'error');
      }
    } catch (err) {
      showNotification('Error al importar JSON - Verifica el formato', 'error');
    }
  }, [setCategories, showNotification]);

  const downloadJSON = useCallback((): void => {
    const dataToDownload = getServerData();
    if (!dataToDownload) {
      showNotification('No data available to download.', 'error');
      return;
    }
    const jsonString = JSON.stringify(dataToDownload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'server-structure-config.json'; // New name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('¡Archivo JSON descargado!');
  }, [getServerData, showNotification]);

  const handleFileUpload = useCallback((file?: File): void => { // file can be undefined
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const parsedData = JSON.parse(result);
            if (isValidServerStructureData(parsedData)) {
              setCategories(parsedData); // Calls applyJsonToStore
              showNotification('¡Archivo JSON cargado correctamente!');
            } else {
              showNotification('La estructura del JSON no es válida. Expected ServerStructureData.', 'error');
            }
          }
        } catch (err) {
          showNotification('Error al leer archivo JSON', 'error');
        }
      };
      reader.readAsText(file);
    } else if (file) { // if file is defined but not JSON
      showNotification('Por favor selecciona un archivo JSON válido', 'error');
    }
  }, [setCategories, showNotification]);

  // applyJsonInput is called by the Textarea in DndView.tsx
  // DndView.tsx already implements the parsing and calling of applyJsonToStore
  // So, this specific applyJsonInput in the hook might be redundant if DndView handles it.
  // For now, let's keep it consistent with other functions.
  const applyJsonInput = useCallback((input: string): boolean => {
     try {
       const parsedData = JSON.parse(input);
       if (isValidServerStructureData(parsedData)) {
         setCategories(parsedData); // Calls applyJsonToStore
         showNotification('Configuración JSON aplicada correctamente.');
         return true;
       } else {
         showNotification('La estructura del JSON no es válida. Expected ServerStructureData.', 'error');
         return false;
       }
     } catch (error) {
       showNotification('Error al procesar el JSON. Verifica la sintaxis y el formato.', 'error');
       return false;
     }
  }, [setCategories, showNotification]);

  return {
    jsonInput,
    setJsonInput,
    copyToClipboard,
    pasteFromClipboard,
    downloadJSON,
    handleFileUpload,
    applyJsonInput
  };
};