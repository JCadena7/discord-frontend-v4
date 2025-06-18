import { useCallback, useState } from 'react';
import { Category } from '../types/discord';
import { isValidCategoriesStructure } from '../utils/dataUtils';

interface UseJsonOperationsProps {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  showNotification: (message: string) => void;
  toBackend?: (categories: Category[]) => any;
  fromBackend?: (data: any) => Category[];
}

export const useJsonOperations = ({
  categories,
  setCategories,
  showNotification,
  toBackend,
  fromBackend,
}: UseJsonOperationsProps) => {
  const [jsonInput, setJsonInput] = useState<string>('');

  const copyToClipboard = useCallback(async (): Promise<void> => {
    try {
      const dataToCopy = toBackend ? toBackend(categories) : categories;
      const jsonString = JSON.stringify(dataToCopy, null, 2);
      await navigator.clipboard.writeText(jsonString);
      showNotification('¡JSON copiado al portapapeles!');
    } catch (err) {
      showNotification('Error al copiar JSON');
    }
  }, [categories, showNotification, toBackend]);

  const pasteFromClipboard = useCallback(async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      let parsedData = JSON.parse(text);
      if (fromBackend) {
        parsedData = fromBackend(parsedData);
      }
      if (isValidCategoriesStructure(parsedData)) {
        setCategories(parsedData);
        showNotification('¡JSON importado correctamente!');
      } else {
        showNotification('La estructura del JSON no es válida o la conversión falló.');
      }
    } catch (err) {
      showNotification('Error al importar JSON - Verifica el formato');
    }
  }, [setCategories, showNotification, fromBackend]);

  const downloadJSON = useCallback((): void => {
    const dataToDownload = toBackend ? toBackend(categories) : categories;
    const jsonString = JSON.stringify(dataToDownload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'channels-roles-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('¡Archivo JSON descargado!');
  }, [categories, showNotification, toBackend]);

  const handleFileUpload = useCallback((file: File): void => {
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            let parsedData = JSON.parse(result);
            if (fromBackend) {
              parsedData = fromBackend(parsedData);
            }
            if (isValidCategoriesStructure(parsedData)) {
              setCategories(parsedData);
              showNotification('¡Archivo JSON cargado correctamente!');
            } else {
              showNotification('La estructura del JSON no es válida o la conversión falló.');
            }
          }
        } catch (err) {
          showNotification('Error al leer archivo JSON');
        }
      };
      reader.readAsText(file);
    } else {
      showNotification('Por favor selecciona un archivo JSON válido');
    }
  }, [setCategories, showNotification, fromBackend]);

  const applyJsonInput = useCallback((input: string): boolean => {
    try {
      let parsedData = JSON.parse(input);
      if (fromBackend) {
        parsedData = fromBackend(parsedData);
      }
      if (isValidCategoriesStructure(parsedData)) {
        setCategories(parsedData);
        showNotification('Configuración JSON aplicada correctamente.');
        return true;
      } else {
        showNotification('La estructura del JSON no es válida o la conversión falló.');
        return false;
      }
    } catch (error) {
      showNotification('Error al procesar el JSON. Verifica la sintaxis y el formato.');
      return false;
    }
  }, [setCategories, showNotification, fromBackend]);

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