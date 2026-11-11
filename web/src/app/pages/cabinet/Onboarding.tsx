import { useEffect, useState } from 'react';
import { useAccount } from '../../lib/account';

/* Жаңа мұғалімге 3 қадам — бір ықшам жол: «Бастау · 1/3 · келесі қадам [әрекет] ×». Бәрі орындалса не жабылса — жоқ. */
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export default function Onboarding({ onClasses, onLook }: { onClasses: () => void; onLook: () => void }) {
  const { profile } = useAccount();
  const [hide, setHide] = useState(() => !!get('fs-onb-done'));
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((x) => x + 1); addEventListener('fs-seen', f); return () => removeEventListener('fs-seen', f); }, []);
  const steps = [
    { ok: !!profile?.classes_set, t: 'Сыныптарыңызды таңдаңыз', go: onClasses, b: 'Таңдау' },
    { ok: (get('fs-seen') || '[]').length > 2, t: 'Бір сабақтың ҚМЖ-сын қараңыз', go: onLook, b: 'Сабақтар' },
    { ok: !!get('fs-board-opened'), t: 'Сабақты тақтада ашыңыз', go: onLook, b: 'Сабақтар' },
  ];
  const cur = steps.findIndex((x) => !x.ok);
  if (hide || cur < 0) return null;
  const close = () => { setHide(true); try { localStorage.setItem('fs-onb-done', '1'); } catch { /* */ } };
  return (
    <div className="strip__row" aria-label="Бастау">
      <span className="strip__k">Бастау</span>
      <span className="strip__dots" aria-label={`${cur} / 3 қадам орындалды`}>{steps.map((x, k) => <i key={k} className={x.ok ? 'ok' : k === cur ? 'on' : ''} />)}</span>
      <span className="strip__t">{steps[cur].t}</span>
      <button type="button" className="link" onClick={steps[cur].go}>{steps[cur].b}</button>
      <button type="button" className="strip__x" onClick={close} aria-label="Жасыру">×</button>
    </div>
  );
}
