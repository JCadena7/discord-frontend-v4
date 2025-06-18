import { useCallback, useState } from 'react';
import { Category, ServerStructureData } from '../types/discord'; // Category for DND view, ServerStructureData for store
import { isValidServerStructureData } from '../utils/dataUtils'; // Assuming this validator exists or will be created

interface UseJsonOperationsProps {
  categories: Category[]; // Used for copy/download of DND view structure
  applyJsonToStore: (data: ServerStructureData) => void; // To apply full structure to store
  showNotification: (message: string, type?: 'success' | 'error') => void; // Added type to showNotification
  // Removed setCategories, toBackend, fromBackend
}

export const useJsonOperations = ({
  categories, // This is DndCategory[] for copy/download
  applyJsonToStore,
  showNotification,
}: UseJsonOperationsProps) => {
  const [jsonInput, setJsonInput] = useState<string>('');

  const copyToClipboard = useCallback(async (): Promise<void> => {
    try {
      // This copies the DndCategory[] structure, not necessarily the full ServerStructureData
      const jsonString = JSON.stringify(categories, null, 2);
      await navigator.clipboard.writeText(jsonString);
      showNotification('Vista DND JSON copiada al portapapeles!');
    } catch (err) {
      console.error("Error copying DND JSON: ", err);
      showNotification('Error al copiar JSON de la vista DND.', 'error');
    }
  }, [categories, showNotification]);

  const pasteFromClipboard = useCallback(async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      const parsedData = JSON.parse(text);
      if (isValidServerStructureData(parsedData)) {
        applyJsonToStore(parsedData);
        setJsonInput(JSON.stringify(parsedData, null, 2)); // Update text area with the valid structure
        showNotification('JSON pegado y aplicado al store!');
      } else {
        showNotification('El JSON del portapapeles no tiene la estructura de ServerStructureData esperada.', 'error');
      }
    } catch (err) {
      console.error("Error pasting JSON: ", err);
      showNotification('Error al pegar JSON o formato inválido.', 'error');
    }
  }, [applyJsonToStore, showNotification]);

  const downloadJSON = useCallback((): void => {
    // This downloads the DndCategory[] structure
    const jsonString = JSON.stringify(categories, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dnd-view-structure.json'; // Filename reflects it's the DND view
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Vista DND JSON descargada!');
  }, [categories, showNotification]);

  const handleFileUpload = useCallback((file: File): void => {
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const parsedData = JSON.parse(result);
            if (isValidServerStructureData(parsedData)) {
              applyJsonToStore(parsedData);
              setJsonInput(JSON.stringify(parsedData, null, 2)); // Update text area
              showNotification('Archivo JSON cargado y aplicado al store!');
            } else {
              showNotification('El archivo JSON no tiene la estructura de ServerStructureData esperada.', 'error');
            }
          }
        } catch (err) {
          console.error("Error processing uploaded JSON file: ", err);
          showNotification('Error al leer o parsear el archivo JSON.', 'error');
        }
      };
      reader.readAsText(file);
    } else {
      showNotification('Por favor selecciona un archivo JSON válido.', 'error');
    }
  }, [applyJsonToStore, showNotification]);

  // This function is intended for the text area in DndView.
  // DndView.tsx's "Aplicar JSON" button for the text area already calls applyJsonToStore directly.
  // This function in the hook could be removed if DndView.tsx handles the text area input parsing and validation itself.
  // Or, DndView.tsx could call this function. Let's keep it for now, ensuring it uses applyJsonToStore.
  const applyJsonInput = useCallback((input: string): boolean => {
    try {
      const parsedData = JSON.parse(input);
      if (isValidServerStructureData(parsedData)) {
        applyJsonToStore(parsedData);
        showNotification('Configuración JSON del editor aplicada al store.');
        return true;
      } else {
        showNotification('El JSON del editor no tiene la estructura de ServerStructureData esperada.', 'error');
        return false;
      }
    } catch (error) {
      console.error("Error applying JSON from editor: ", error);
      showNotification('Error al procesar el JSON del editor. Verifica la sintaxis.', 'error');
      return false;
    }
  }, [applyJsonToStore, showNotification]);

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