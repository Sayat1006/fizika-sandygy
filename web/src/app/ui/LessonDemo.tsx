import { useEffect, useRef, useState } from 'react';

/* Басты беттегі қысқа көрініс: тақтадан сұрақ → оқушылар телефоннан жауап береді → нәтиже тақтада.
   Таза CSS/React, ауыр кітапханасыз; экранда көрінгенде ғана ойнайды. */
const TXT = {
  kk: { h: 'Сабақ қалай өтеді', steps: ['Тақтадан сұрақ жібересіз', 'Оқушылар телефоннан жауап береді', 'Нәтиже бірден тақтада'], q: 'Ең тығыз зат қайсы?', o: ['Ауа', 'Су', 'Темір'], who: 'Жауап берді' },
  ru: { h: 'Как проходит урок', steps: ['Вы отправляете вопрос с доски', 'Ученики отвечают с телефона', 'Результат сразу на доске'], q: 'Какое вещество плотнее?', o: ['Воздух', 'Вода', 'Железо'], who: 'Ответили' },
};
const RES = [2, 5, 21];

export default function LessonDemo({ lang }: { lang: 'kk' | 'ru' }) {
  const t = TXT[lang];
  const [ph, setPh] = useState(0);
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = window.setInterval(() => setPh((p) => (p + 1) % 3), 2600);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); clearInterval(timer); };
  }, []);
  const n = ph === 0 ? 0 : ph === 1 ? 17 : 28;
  return (
    <section className="demo" ref={box} aria-label={t.h}>
      <h2 className="t-title">{t.h}</h2>
      <ol className="demo__steps">{t.steps.map((s, k) => <li key={k} className={k === ph ? 'on' : ''}><b>{k + 1}</b>{s}</li>)}</ol>
      <div className="demo__scene" data-ph={ph}>
        <div className="demo__board">
          <div className="demo__q">{t.q}</div>
          <div className="demo__bars">
            {t.o.map((o, k) => (
              <div key={o} className={`demo__bar${ph === 2 && k === 2 ? ' demo__bar--ok' : ''}`}>
                <span>{'ABC'[k]} · {o}</span><i><em style={{ width: ph === 2 ? `${(RES[k] / 21) * 100}%` : '0%' }} /></i><b>{ph === 2 ? RES[k] : ''}</b>
              </div>
            ))}
          </div>
          <div className="demo__who">{t.who}: <b>{n}</b> / 28</div>
        </div>
        <div className="demo__phone">
          <div className="demo__ph-q">{t.q}</div>
          {t.o.map((o, k) => <div key={o} className={`demo__opt${ph >= 1 && k === 2 ? ' demo__opt--on' : ''}`}><b>{'ABC'[k]}</b>{o}</div>)}
          <div className={`demo__sent${ph >= 1 ? ' on' : ''}`}>✓</div>
        </div>
      </div>
    </section>
  );
}
