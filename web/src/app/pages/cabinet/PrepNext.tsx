import { useEffect, useMemo, useState } from 'react';
import { useAccount } from '../../lib/account';
import { VARIANT, week } from '../../lib/config';
import { dm, type Lesson } from '../../lib/data';
import { isSeen } from '../../lib/seen';

const DOW = ['дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі', 'жексенбі'];
const dowOf = (d: string) => DOW[((Date.parse(d) / 864e5 + 3) % 7 + 7) % 7];

/** «Келесі сабақтарға дайындық»: бүгіннен кейінгі жақын сабақ күні, әр сабақ — ҚМЖ қаралды ма, файлдар жүктелді ме */
export default function PrepNext({ lessons, onOpen }: { lessons: Lesson[]; onOpen: (l: Lesson) => void }) {
  const { profile, got } = useAccount();
  const [, tick] = useState(0);
  const [open, setOpenS] = useState(() => { try { return localStorage.getItem('fs-prep-open') === '1'; } catch { return false; } });
  const setOpen = (b: boolean) => { setOpenS(b); try { localStorage.setItem('fs-prep-open', b ? '1' : ''); } catch { /* */ } };
  useEffect(() => { const f = () => tick((x) => x + 1); addEventListener('fs-seen', f); return () => removeEventListener('fs-seen', f); }, []);
  const w = week();
  const mine = profile?.variants || [];
  const my = useMemo(() => lessons.filter((l) => mine.includes(l.v)), [lessons, mine.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = my.map((l) => l.date).filter((d) => d > w.today).sort()[0];
  if (!next) return null;
  const gradeOf = (l: Lesson) => VARIANT[l.v]?.grade || l.grade;
  const list = my.filter((l) => l.date === next).sort((a, b) => gradeOf(a) - gradeOf(b) || a.n - b.n);
  const ready = list.filter((l) => isSeen(l.v, l.n) || got.has(`${l.v}|${l.n}|kmzh`)).length;
  return (
    <div className={`strip__row strip__row--prep${open ? ' is-open' : ''}`}>
      <button type="button" className="strip__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="strip__k">Келесі сабақтар</span>
        <span className="strip__t">{dm(next)}, {dowOf(next)} · {list.length} сабақ</span>
        <span className={`strip__n${ready === list.length ? ' strip__n--ok' : ''}`}>дайын {ready} / {list.length}</span>
        <i className="strip__chev" aria-hidden />
      </button>
      {open && (
        <ul className="prep__list">
          {list.map((l) => {
            const seen = isSeen(l.v, l.n), dl = got.has(`${l.v}|${l.n}|kmzh`) || got.has(`${l.v}|${l.n}|pres`), ok = seen || dl;
            return (
              <li key={l.v + l.n}>
                <button type="button" onClick={() => onOpen(l)}>
                  <span className="prep__g">{gradeOf(l)}</span>
                  <span className="prep__t">{l.topic}</span>
                  <span className={`prep__b${ok ? ' prep__b--ok' : ''}`}>{ok ? (dl ? 'жүктелді' : 'қаралды') : 'қаралмаған'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
