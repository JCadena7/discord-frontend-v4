import { useCallback, useState } from 'react';
import { Category } from '../types/discord';
import { isValidCategoriesStructure } from '../utils/dataUtils';

interface UseJsonOperationsProps {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  showNotification: (message: string) => void;
}

export const useJsonOperations = ({ categories, setCategories, showNotification }: UseJsonOperationsProps) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const copyToClipboard = useCallback(async (): Promise<void> => {
    try {
      const jsonData = JSON.stringify(categories, null, 2);
      await navigator.clipboard.writeText(jsonData);
      showNotification('¡JSON copiado al portapapeles!');
    } catch (err) {
      showNotification('Error al copiar JSON');
    }
  }, [categories, showNotification]);

  const pasteFromClipboard = useCallback(async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      
      if (isValidCategoriesStructure(parsed)) {
        setCategories(parsed);
        showNotification('¡JSON importado correctamente!');
      } else {
        showNotification('Formato JSON inválido');
      }
    } catch (err) {
      showNotification('Error al importar JSON - Verifica el formato');
    }
  }, [setCategories, showNotification]);

  const downloadJSON = useCallback((): void => {
    const jsonData = JSON.stringify(categories, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'channels-roles-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('¡Archivo JSON descargado!');
  }, [categories, showNotification]);

  const handleFileUpload = useCallback((file: File): void => {
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            if (isValidCategoriesStructure(parsed)) {
              setCategories(parsed);
              showNotification('¡Archivo JSON cargado correctamente!');
            } else {
              showNotification('Formato de archivo inválido');
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
  }, [setCategories, showNotification]);

  const applyJsonInput = useCallback((jsonInput: string): boolean => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (isValidCategoriesStructure(parsed)) {
        setCategories(parsed);
        showNotification('¡Configuración aplicada!');
        return true;
      } else {
        showNotification('Formato JSON inválido');
        return false;
      }
    } catch (err) {
      showNotification('JSON mal formateado');
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