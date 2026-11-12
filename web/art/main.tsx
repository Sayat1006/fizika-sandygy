/* Тек құрал үшін (tools/deck/art_png.py): v3 суреттерін және интерактивті модельдерді
   қозғалыссыз күйде бір бетке шығарады, кейін әрқайсысы PNG-ге түсіріліп, .pptx-ке салынады. Сайтқа кірмейді. */
import { createRoot } from 'react-dom/client';
import Art, { SCENES } from '../src/app/deck/v3/Art';
import Illus, { ILLUS } from '../src/app/deck/Illus';
import '../src/app/deck/deck.css';
import '../src/app/deck/v3/deck3.css';

const theme = new URLSearchParams(location.search).get('t') || 'a';
const st = document.createElement('style');
st.textContent = `*{animation:none!important;transition:none!important}.a3-steam{opacity:.85!important}.a3-draw{stroke-dashoffset:0!important}
.cell{position:relative;width:1350px;height:1050px;overflow:hidden;background:var(--d-card)}.cell svg.a3{width:100%;height:100%;display:block}
.mcell{position:relative;width:1350px;height:1000px;background:var(--d-card)}.mcell .dk-ctl,.mcell .dk-ill__out{display:none}`;
document.head.appendChild(st);
createRoot(document.getElementById('root')!).render(
  <div className={`dk dk--${theme}`} style={{ position: 'static', width: 'auto', height: 'auto' }}>
    {Object.keys(SCENES).map((id) => <div key={id} className="cell" data-art={id}><Art id={id} /></div>)}
    {[...ILLUS].map((k) => <div key={k} className="mcell" data-model={k}><Illus s={{ k }} /></div>)}
  </div>,
);
