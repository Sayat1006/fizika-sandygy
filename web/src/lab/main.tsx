import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { refreshIfNeeded } from '../shared/labOffline';

// Сервис-воркер (public/sw.js): алдын ала жүктелген зертхана интернетсіз ашылады
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); setTimeout(() => void refreshIfNeeded(), 4000); });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
