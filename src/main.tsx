import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Captura los tokens de la URL y los guarda en localStorage
(function() {
  const params = new URLSearchParams(window.location.search);
  console.log("params: ",params)
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  console.log("accessToken de main  guardado: ",accessToken)
  console.log("refreshToken de main guardado: ",refreshToken)
  if (accessToken && refreshToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    // Limpia la URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
