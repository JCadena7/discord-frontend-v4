import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState<string>('');
  
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  }, []);
  
  return { notification, showNotification };
};