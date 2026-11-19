/* Флешкадағы 3D тәжірибе: files/lab.html?embed=1#/experiments/<id> (тақтадағы iframe). Маршрут — хэш арқылы (file:// үшін). */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Shell } from '../lab/App';
import '../lab/styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><Shell /></HashRouter></StrictMode>);
