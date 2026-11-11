import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { stepsOf, type DeckData } from '../deck/types';

const Deck = lazy(() => import('../deck/Deck'));

/* Басты беттің басты көрінісі: нақты тақта — анимациялы презентация өздігінен ойнайды,
   жанында оқушының телефоны. Үлгі презентация: public/demo/deck.json (7-сынып, тегін үлгі).
   Экранда көрінгенде ғана ойнайды; «азырақ қозғалыс» баптауында — бірінші слайд қана. */
export default function HeroBoard({ lang }: { lang: 'kk' | 'ru' }) {
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [at, setAt] = useState(0);
  const [step, setStep] = useState(0);
  const [on, setOn] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { fetch('/demo/deck.json').then((r) => r.json()).then(setDeck).catch(() => {}); }, []);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.3 });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!deck || !on || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => {
      if (step < stepsOf(deck.slides[at])) setStep(step + 1);
      else { setAt((at + 1) % Math.min(deck.slides.length, 8)); setStep(0); }
    }, step === 0 ? 1600 : 1100);
    return () => clearTimeout(t);
  }, [deck, on, at, step]);
  const L = lang === 'kk'
    ? { stage: 'Сабақтың басы · 6 мин', q: 'Жылдамдық — векторлық шама ма?', yes: 'Иә', no: 'Жоқ', sent: 'Жауап жіберілді', live: 'Сабақта: 28 оқушы' }
    : { stage: 'Начало урока · 6 мин', q: 'Скорость — векторная величина?', yes: 'Да', no: 'Нет', sent: 'Ответ отправлен', live: 'На уроке: 28 учеников' };
  return (
    <div className="hb" ref={box} aria-hidden>
      <div className="hb__board">
        <div className="hb__top"><i /><i /><i /><span>{L.stage}</span><b className="tabular">4:12</b></div>
        <div className="hb__stage">
          {deck ? <Suspense fallback={<img className="hb__poster" src="/samples/7/pres_01.jpg" alt="" />}><Deck data={deck} index={at} step={step} theme="a" /></Suspense>
            : <img className="hb__poster" src="/samples/7/pres_01.jpg" alt="" />}
        </div>
        <div className="hb__bar"><em style={{ width: `${((at + 1) / 8) * 100}%` }} /></div>
      </div>
      <div className="hb__phone">
        <small>{L.live}</small>
        <p>{L.q}</p>
        <span className="hb__opt hb__opt--on">{L.yes}<i>✓</i></span>
        <span className="hb__opt">{L.no}</span>
        <small className="hb__sent">{L.sent}</small>
      </div>
    </div>
  );
}
