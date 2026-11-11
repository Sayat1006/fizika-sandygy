import { useEffect, useState } from 'react';
import { useAccount } from '../../lib/account';

/* Жаңа мұғалімге 3 қадам: сыныпты таңдау → сабақты қарау → тақтада ашу. Бәрі орындалса не жабылса — көрінбейді. */
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export default function Onboarding({ onClasses, onLook }: { onClasses: () => void; onLook: () => void }) {
  const { profile } = useAccount();
  const [hide, setHide] = useState(() => !!get('fs-onb-done'));
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((x) => x + 1); addEventListener('fs-seen', f); return () => removeEventListener('fs-seen', f); }, []);
  const s1 = !!profile?.classes_set, s2 = (get('fs-seen') || '[]').length > 2, s3 = !!get('fs-board-opened');
  if (hide || (s1 && s2 && s3)) return null;
  const close = () => { setHide(true); try { localStorage.setItem('fs-onb-done', '1'); } catch { /* */ } };
  const steps = [
    { ok: s1, t: 'Сыныптарыңызды таңдаңыз', d: 'Кабинетте тек сол сыныптардың сабақтары шығады.', go: onClasses, b: 'Таңдау' },
    { ok: s2, t: 'Сабақтың ҚМЖ-сын қараңыз', d: 'Сабақты басыңыз — ҚМЖ мен презентация ашылады, жүктеп алуға болады.', go: onLook, b: 'Қарау' },
    { ok: s3, t: 'Сабақты тақтада ашыңыз', d: 'Сыныпта «Сабақ барысы» режимі: слайдтар, таймер, оқушылардың телефоны.', go: onLook, b: 'Ашу' },
  ];
  const cur = steps.findIndex((x) => !x.ok);
  return (
    <section className="onb rise" aria-label="Бастау">
      <header><b>Сабақтасқа қош келдіңіз! 3 қадам</b><button type="button" className="onb__x" onClick={close} aria-label="Жабу">×</button></header>
      <ol>
        {steps.map((x, k) => (
          <li key={k} className={x.ok ? 'ok' : k === cur ? 'on' : ''}>
            <i>{x.ok ? '✓' : k + 1}</i>
            <span><b>{x.t}</b><small>{x.d}</small></span>
            {!x.ok && k === cur && <button type="button" className="btn btn--sm btn--primary" onClick={x.go}>{x.b}</button>}
          </li>
        ))}
      </ol>
    </section>
  );
}
