import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { refreshAppPack, registerSW } from './lib/offline';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/cabinet.css';
import './styles/board.css';
import './deck/deck.css';
import './deck/v3/deck3.css'; // негізгі стильде: тақта интернетсіз ашылғанда бөлек CSS жүктелмей қалмасын

registerSW();
// сайт жаңарса — офлайнға сақталған сабақтар интернетсіз ашыла беруі үшін жаңа нұсқаны фонда жүктеп қоямыз
if (import.meta.env.PROD) setTimeout(() => void refreshAppPack(), 5000);
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
