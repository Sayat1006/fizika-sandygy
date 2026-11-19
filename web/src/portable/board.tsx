/* Флешкадағы сабақ: «Сабақты ашу.html» → files/data.js (window.SBQ) + осы ойнатқыш.
   Интернетсіз, кабинетке кірусіз, браузерде файл ретінде (file://) ашылады. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BoardView, { type BoardData } from '../app/pages/board/BoardView';
import '../app/styles/tokens.css';
import '../app/styles/base.css';
import '../app/styles/components.css';
import '../app/styles/board.css';
import '../app/deck/deck.css';
import '../app/deck/v3/deck3.css';

const USB = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8v6H8zM6 8h12v9a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM10 4.5h.01M14 4.5h.01" /></svg>;
const data = (window as unknown as { SBQ?: BoardData }).SBQ;
const root = createRoot(document.getElementById('root')!);
if (!data) root.render(<div className="bd bd--msg"><div className="bd-msg"><b>Сабақ файлдары табылмады</b><span>«files» папкасы «Сабақты ашу.html» файлымен бір жерде тұруы керек.</span></div></div>);
else {
  document.title = `${data.lesson.topic} · Сабақтас`;
  root.render(<StrictMode><BoardView data={data} back={<span className="bd-ib bd-usb" title="Флешкадан ашылған сабақ" aria-hidden>{USB}</span>} /></StrictMode>);
}
