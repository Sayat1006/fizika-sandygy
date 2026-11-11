import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { registerSW } from './lib/offline';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/cabinet.css';
import './styles/board.css';
import './deck/deck.css'; // негізгі стильде: тақта интернетсіз ашылғанда бөлек CSS жүктелмей қалмасын

registerSW();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
