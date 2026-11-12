import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Chart, DeckData, Dir, Quote, Scale, Slide, Vec, Visual } from './types';
import Illus, { ILLUS } from './Illus';
import Slide3, { V3 } from './v3/Slides3';

/* Анимациялы слайд: 1920×1080 сахна, контейнерге сыйғызылады. step — неше рет басылды. */
export type Theme = 'a' | 'b' | 'c';
export const THEMES: { id: Theme; name: string }[] = [{ id: 'a', name: 'Ақ парақ' }, { id: 'b', name: 'Түнгі зертхана' }, { id: 'c', name: 'Дәптер' }];

export default function Deck({ data, index, step, theme, stageRef }: { data: DeckData; index: number; step: number; theme: Theme; stageRef?: React.Ref<HTMLDivElement> }) {
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ k: 0, x: 0, y: 0 });
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const f = () => { const w = el.clientWidth, h = el.clientHeight, k = Math.min(w / 1920, h / 1080); setFit({ k, x: (w - 1920 * k) / 2, y: (h - 1080 * k) / 2 }); };
    f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect();
  }, []);
  const s = data.slides[index];
  return (
    <div className="dk-box" ref={box}>
      <div ref={stageRef} className={`dk dk--${theme}`} style={{ transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.k})`, visibility: fit.k ? 'visible' : 'hidden' }}>
        <section className="dk-slide" key={index}>
          {V3.has(s.t) ? <Slide3 s={s} step={step} no={index + 1} /> : <SlideView s={s} step={step} custom={!!data.custom} />}
          {s.t !== 'title' && s.t !== 'end' && !V3.has(s.t) && <div className="dk-foot"><span>{data.topic}</span><span>{index + 1}</span></div>}
        </section>
      </div>
    </div>
  );
}

const In = ({ on, children, className = '', style, as: T = 'div' }: { on: boolean; children: ReactNode; className?: string; style?: CSSProperties; as?: 'div' | 'li' | 'p' }) =>
  <T className={`dk-step${on ? ' dk-in' : ''} ${className}`} style={style}>{children}</T>;

function Head({ tag, time, title }: { tag?: string; time?: string; title?: string }) {
  return (
    <>
      {(tag || time) && <div className="dk-tag"><b>{tag}</b>{time && <span>{time}</span>}</div>}
      {title && <h2 className="dk-h">{title}</h2>}
    </>
  );
}

function SlideView({ s, step, custom }: { s: Slide; step: number; custom: boolean }) {
  switch (s.t) {
    case 'title':
      return (
        <div className="dk-pad dk-title">
          <div className="dk-kicker">{s.kicker}</div>
          <h1 className={`dk-tl${s.title.length > 70 ? '4' : s.title.length > 48 ? '3' : s.title.length > 30 ? '2' : ''}`}>{s.title}</h1>
          <p className="dk-sub">{s.sub}</p>
          {s.foot && <p className="dk-value">{s.foot}</p>}
          {custom ? <TitleArt /> : <AtomArt />}
        </div>
      );
    case 'goals':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <ol className="dk-goals">{s.items.map((t, i) => <In as="li" key={i} on={step > i}><span className="dk-num">{i + 1}</span><Rich t={t} /></In>)}</ol>
          {s.code && <p className="dk-code">Оқу мақсаты: {s.code}</p>}
        </div>
      );
    case 'yesno':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          {s.sub && <p className="dk-lead">{s.sub}</p>}
          <div className="dk-yn">
            {s.items.map(([t, ok], i) => (
              <div key={i} className="dk-yn__row"><span className="dk-yn__n">{i + 1}</span><span className="dk-yn__t">{t}</span>
                <span className={`dk-yn__a dk-yn__a--${ok ? 'y' : 'n'}${step > i ? ' dk-pop' : ''}`}>{ok ? 'Иә' : 'Жоқ'}</span></div>
            ))}
          </div>
          {s.quote && <QuoteView q={s.quote} small />}
        </div>
      );
    case 'problem':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} />
          <div className="dk-prob">
            <div className="dk-prob__txt">
              <p>{s.lead}</p>
              <In on={step >= 1} as="p">{s.twist}</In>
              <In on={step >= 2} as="p" className="dk-ask">{s.ask}</In>
              {s.note && <In on={step >= 2} as="p" className="dk-hand">{s.note}</In>}
            </div>
            <Walkers on={step >= 1} />
          </div>
        </div>
      );
    case 'compare':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-two">
            {[s.left, s.right].map((c, k) => (
              <In key={k} on={step > k} className="dk-col">
                <h3 className={k ? 'dk-vec' : 'dk-sca'}>{c.name}</h3>
                <p className="dk-def">{c.def}</p>
                <div className="dk-ex">
                  {c.ex.map((e, i) => (
                    <div key={i}><b>{e[0]}</b>{k === 1 && <Arrow deg={Number(e[2] || 0)} />}<span>{e[1]}</span></div>
                  ))}
                </div>
              </In>
            ))}
          </div>
          {s.note && <In on={step >= 3} as="p" className="dk-hand dk-note">{s.note}</In>}
        </div>
      );
    case 'picture':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className={`dk-split${s.illus ? ' dk-split--ill' : ''}`}>
            <div className="dk-card dk-pic">{hasVisual(s) ? <VisualView v={s} /> : <VecAdd />}</div>
            <div className="dk-qs">
              {s.items.map((t, i) => <In key={i} on={step > i} className="dk-q"><span className="dk-num">?</span>{t}</In>)}
              {s.note && <p className="dk-hand">{s.note}</p>}
            </div>
          </div>
        </div>
      );
    case 'link':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-split dk-split--qr">
            <ol className="dk-goals">{s.items.map((t, i) => <li key={i} className="dk-step dk-in"><span className="dk-num">{i + 1}</span>{t}</li>)}</ol>
            <div className="dk-qr">{s.qr && <img src={s.qr} alt="QR-код" />}<span>{s.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span></div>
          </div>
        </div>
      );
    case 'vectors':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-split dk-split--grid">
            <div className="dk-card dk-gridbox"><VectorGrid scale={s.scale} vectors={s.vectors} shown={step} /></div>
            <div className="dk-qs">
              {s.chain && <div className="dk-chain">{s.chain.map((c, i) => <span key={i}>{c}</span>)}</div>}
              <p className="dk-task">{s.task}</p>
              {s.vectors.map((v, i) => <In key={i} on={step > i} className="dk-q"><span className={`dk-num dk-num--${i % 2 ? 's' : 'v'}`}>{i + 1}</span>{v.name} = {v.mag} {s.scale.unit} → {v.mag / s.scale.cell} тор {DIRS[v.dir]}</In>)}
            </div>
          </div>
        </div>
      );
    case 'break':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          {s.text && <div className="dk-break"><BreakArt /><p><Rich t={s.text} /></p></div>}
          {s.rules && <div className="dk-rules">{s.rules.map(([a, b], i) => <div key={i} className={`dk-rule dk-rule--${i ? 'n' : 'y'}`}><b>{a}</b><span>{b}</span></div>)}</div>}
          {s.items && <ol className="dk-goals dk-goals--sm">{s.items.map((t, i) => <li key={i} className="dk-step dk-in"><span className="dk-num">{i + 1}</span>{t}</li>)}</ol>}
        </div>
      );
    case 'levels':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-levels">{s.items.map(([k, t], i) => <In key={k} on={step > i} className={`dk-level dk-level--${i}`}><b>{k}</b><span>{k} деңгейі</span><small>{t}</small></In>)}</div>
          {s.note && <p className="dk-hand dk-note">{s.note}</p>}
        </div>
      );
    case 'sort':
      return <Sort s={s} step={step} />;
    case 'task':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} />
          <div className={`dk-task-row${s.illus || s.vectors ? '' : ' dk-task-row--solo'}`}>
            <div className="dk-qs">
              <div className="dk-lvl">{s.level}</div>
              <p className="dk-qtext"><Rich t={s.q} /></p>
              <In on={step >= 1} className="dk-answer"><small>Жауабы</small><Rich t={s.answer} /></In>
            </div>
            {(s.illus || s.vectors) && <div className="dk-card dk-gridbox">
              {s.illus === 'track' ? <Track run={step >= 1} /> : s.vectors && s.scale ? <VectorGrid scale={s.scale} vectors={s.vectors} shown={step >= 1 ? s.vectors.length : 0} /> : null}
            </div>}
          </div>
        </div>
      );
    case 'qa':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-split dk-split--qr">
            <div className="dk-yn">
              {s.items.map(([q, a], i) => (
                <div key={i} className="dk-yn__row"><span className="dk-yn__n">{i + 1}</span><span className="dk-yn__t"><Rich t={q} /></span><span className={`dk-yn__a dk-yn__a--v${step > i ? ' dk-pop' : ''}`}><Rich t={a} /></span></div>
              ))}
            </div>
            {s.qr && <div className="dk-qr"><img src={s.qr} alt="QR-код" /><span>{s.qrLabel || 'Socrative'}</span></div>}
          </div>
        </div>
      );
    case 'reflect':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-split">
            {s.fingers ? <div className="dk-fingers">{s.fingers.map(([a, b], i) => <div key={i}><Hand n={i} /><b>{a}</b><span>{b}</span></div>)}</div>
              : <div className="dk-card dk-refl"><Rich t={s.text || ''} /></div>}
            <div className="dk-scale">{s.scale.map(([a, b], i) => <div key={i} className={`dk-scale--${i}`}><b>{a} балл</b><span>{b}</span></div>)}</div>
          </div>
        </div>
      );
    case 'homework':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-levels dk-levels--hw">{s.items.map(([k, t], i) => <div key={k} className={`dk-level dk-level--${i} dk-step dk-in`}><b>{k}</b><span><Rich t={t} /></span></div>)}</div>
        </div>
      );
    case 'text':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          {s.sub && <p className="dk-lead">{s.sub}</p>}
          <div className="dk-paras">{s.paras.map((t, i) => <p key={i}><Rich t={t} /></p>)}</div>
          {s.task && <div className="dk-taskbox"><small>Тапсырма</small><Rich t={s.task.replace(/^\*\*Тапсырма:\*\*\s*/, '')} /></div>}
          {s.quote && <QuoteView q={s.quote} small />}
        </div>
      );
    case 'hook':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} />
          <div className="dk-hook">
            <div className="dk-hook__txt">
              <p><Rich t={s.text} /></p>
              <In on={step >= 1} as="p" className="dk-hand">{s.ask}</In>
            </div>
            <HookArt />
          </div>
        </div>
      );
    case 'theory': {
      const vis = hasVisual(s);
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className={vis ? `dk-split dk-split--th${s.illus ? ' dk-split--thill' : ''}` : 'dk-solo'}>
            <ul className="dk-bul">{s.items.map((t, i) => <In as="li" key={i} on={step > i}><Rich t={t} /></In>)}</ul>
            {vis && <div className="dk-card dk-pic"><VisualView v={s} />{s.caption && s.img && !s.illus && <span className="dk-cap">{s.caption}</span>}</div>}
          </div>
        </div>
      );
    }
    case 'formulas':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-forms">{s.items.map((t, i) => <In key={i} on={step > i} className="dk-form"><span className="dk-num">{i + 1}</span><Rich t={t} /></In>)}</div>
        </div>
      );
    case 'equip':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-equip">{s.items.map((t, i) => <div key={i} className="dk-step dk-in" style={{ transitionDelay: `${i * 0.08}s` }}><EquipIcon name={t} />{t[0].toUpperCase() + t.slice(1)}</div>)}</div>
        </div>
      );
    case 'procedure':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <ol className="dk-goals dk-goals--proc">{s.items.map((t, i) => <In as="li" key={i} on={step > i}><span className="dk-num">{i + 1}</span><Rich t={t} /></In>)}</ol>
        </div>
      );
    case 'table':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <table className="dk-table"><thead><tr><th>№</th>{s.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{Array.from({ length: s.rows }, (_, r) => <tr key={r}><td>{r + 1}</td>{s.head.map((_, i) => <td key={i} />)}</tr>)}</tbody></table>
          {s.note && <p className="dk-hand dk-note">{s.note}</p>}
        </div>
      );
    case 'chart':
      return (
        <div className="dk-pad">
          <Head tag={s.tag} time={s.time} title={s.title} />
          <div className="dk-split dk-split--chart">
            <div className="dk-card dk-pic"><ChartView c={s.chart} /></div>
            <ol className="dk-goals dk-goals--sm">{s.items.map((t, i) => <li key={i} className="dk-step dk-in"><span className="dk-num">{i + 1}</span>{t}</li>)}</ol>
          </div>
        </div>
      );
    case 'end':
      return (
        <div className="dk-pad dk-end">
          {custom ? <TitleArt small /> : <AtomArt small />}
          <h1>{s.title}</h1>
          {s.quote && <QuoteView q={s.quote} />}
        </div>
      );
  }
}

const DIRS: Record<Dir, string> = { right: 'оңға', left: 'солға', up: 'жоғары', down: 'төмен' };

function QuoteView({ q, small }: { q: Quote; small?: boolean }) {
  return <blockquote className={`dk-quote${small ? ' dk-quote--sm' : ''}`}>«{q.text}»<cite>— {q.by}</cite></blockquote>;
}

function Arrow({ deg }: { deg: number }) {
  return (
    <svg className="dk-arrow" viewBox="0 0 150 60" aria-hidden><g transform={`rotate(${deg} 75 30)`}>
      <line x1="20" y1="30" x2="112" y2="30" className="dk-sv" strokeWidth="7" strokeLinecap="round" /><polygon points="138,30 108,15 108,45" className="dk-fv" />
    </g></svg>
  );
}

function Sort({ s, step }: { s: Extract<Slide, { t: 'sort' }>; step: number }) {
  const [own, setOwn] = useState<Set<number>>(new Set());
  useEffect(() => setOwn(new Set()), [step]);
  return (
    <div className="dk-pad">
      <Head tag={s.tag} time={s.time} title={s.title} />
      <div className="dk-quiz">
        {s.items.map(([t, k], i) => {
          const flip = (i < step) !== own.has(i);
          return (
            <button key={i} type="button" className={`dk-cardf${flip ? ' dk-flip' : ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); const o = new Set(own); if (o.has(i)) o.delete(i); else o.add(i); setOwn(o); }}>
              <span><i className="dk-f">{t}</i><i className={`dk-b dk-b--${k}`}>{k === 's' ? 'Скаляр' : 'Векторлық'}<small>{k === 's' ? 'тек сан мәні' : 'сан + бағыт'}</small></i></span>
            </button>
          );
        })}
      </div>
      <div className="dk-legend"><span><i className="dk-bg-s" />Скаляр</span><span><i className="dk-bg-v" />Векторлық</span><span className="dk-hint">Карточканы басып та ашуға болады</span></div>
    </div>
  );
}

/* ───────── сызбалар ───────── */
function TitleArt({ small }: { small?: boolean }) {
  return (
    <svg className={`dk-titleart${small ? ' dk-titleart--sm' : ''}`} viewBox="0 0 760 760" aria-hidden>
      <g className="dk-float">
        <circle cx="380" cy="380" r="300" fill="none" className="dk-sg" strokeWidth="3" strokeDasharray="6 14" />
        <line x1="160" y1="560" x2="560" y2="200" className="dk-sv dk-draw" style={{ '--len': 540 } as CSSProperties} strokeWidth="16" strokeLinecap="round" />
        <polygon points="600,164 520,182 572,240" className="dk-fv dk-popd" />
        <line x1="160" y1="560" x2="560" y2="560" className="dk-ss dk-draw" style={{ '--len': 400, animationDelay: '.5s' } as CSSProperties} strokeWidth="12" strokeLinecap="round" />
        <circle cx="160" cy="560" r="22" className="dk-fi" />
        <g transform="translate(470 440)"><text className="dk-lbl dk-fv" fontSize="76" fontStyle="italic">F</text><line x1="4" y1="-70" x2="44" y2="-70" className="dk-sv" strokeWidth="5" strokeLinecap="round" /><polygon points="56,-70 40,-79 40,-61" className="dk-fv" /></g>
      </g>
    </svg>
  );
}

function Walkers({ on }: { on: boolean }) {
  return (
    <svg className="dk-walk" viewBox="0 0 700 700" aria-label="Мектептен екі бағытқа шыққан екі оқушы">
      <defs><pattern id="dk-gp" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" className="dk-sg" strokeWidth="2" /></pattern></defs>
      <rect width="700" height="700" rx="28" fill="url(#dk-gp)" />
      <g transform="translate(150 520)"><rect x="-56" y="-40" width="112" height="80" rx="8" className="dk-fi" /><polygon points="-70,-38 0,-90 70,-38" className="dk-fi" /><rect x="-14" y="6" width="28" height="34" className="dk-fbg" /></g>
      <text x="150" y="610" textAnchor="middle" className="dk-lbl dk-fi" fontSize="28">Мектеп</text>
      <g className={`dk-step${on ? ' dk-in' : ''}`}>
        <g transform="translate(590 520)"><rect x="-62" y="-38" width="124" height="76" rx="12" className="dk-fs" /><text y="11" textAnchor="middle" className="dk-lbl" fill="#fff" fontSize="30">Дүкен</text></g>
        <g transform="translate(150 110)"><circle cx="-24" cy="0" r="34" className="dk-fv" opacity=".75" /><circle cx="22" cy="-10" r="40" className="dk-fv" /><rect x="-6" y="20" width="12" height="40" className="dk-fi" /><text x="70" y="10" className="dk-lbl dk-fi" fontSize="30">Саябақ</text></g>
        <line x1="212" y1="520" x2="520" y2="520" className="dk-ss" strokeWidth="12" strokeLinecap="round" />
        <line x1="150" y1="456" x2="150" y2="172" className="dk-sv" strokeWidth="12" strokeLinecap="round" />
        {on && <>
          <circle r="16" className="dk-fs"><animateMotion dur="2.6s" repeatCount="indefinite" path="M212 520 H520" /></circle>
          <circle r="16" className="dk-fv"><animateMotion dur="2.6s" repeatCount="indefinite" path="M150 456 V172" /></circle>
        </>}
        <text x="366" y="580" textAnchor="middle" className="dk-lbl dk-fi" fontSize="34">100 м</text>
        <text x="180" y="330" className="dk-lbl dk-fi" fontSize="34">100 м</text>
      </g>
    </svg>
  );
}

function VecAdd() {
  return (
    <svg viewBox="0 0 900 560" aria-label="Векторларды қосу және проекция">
      <defs><pattern id="dk-g6" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" className="dk-sg" strokeWidth="2" /></pattern></defs>
      <rect width="900" height="560" fill="url(#dk-g6)" />
      {/* a + b */}
      <line x1="60" y1="460" x2="290" y2="370" className="dk-sv" strokeWidth="9" strokeLinecap="round" /><polygon points="318,359 280,352 292,388" className="dk-fv" />
      <line x1="320" y1="358" x2="400" y2="150" className="dk-ss" strokeWidth="9" strokeLinecap="round" /><polygon points="410,122 388,152 418,162" className="dk-fs" />
      <line x1="60" y1="460" x2="384" y2="142" className="dk-sa" strokeWidth="9" strokeLinecap="round" strokeDasharray="1 0" /><polygon points="408,120 370,134 394,160" className="dk-fa" />
      <text x="150" y="455" className="dk-lbl dk-fv" fontSize="40" fontStyle="italic">a</text>
      <text x="380" y="280" className="dk-lbl dk-fs" fontSize="40" fontStyle="italic">b</text>
      <text x="150" y="260" className="dk-lbl dk-fa" fontSize="40" fontStyle="italic">a + b</text>
      {/* проекция */}
      <line x1="560" y1="480" x2="860" y2="480" className="dk-si" strokeWidth="4" />
      <line x1="600" y1="460" x2="760" y2="180" className="dk-sv" strokeWidth="9" strokeLinecap="round" /><polygon points="774,154 748,182 778,196" className="dk-fv" />
      <line x1="600" y1="460" x2="600" y2="480" className="dk-si" strokeWidth="3" strokeDasharray="8 8" />
      <line x1="772" y1="160" x2="772" y2="480" className="dk-si" strokeWidth="3" strokeDasharray="8 8" />
      <line x1="600" y1="480" x2="772" y2="480" className="dk-ss" strokeWidth="12" strokeLinecap="round" />
      <text x="690" y="300" className="dk-lbl dk-fv" fontSize="40" fontStyle="italic">s</text>
      <text x="660" y="530" className="dk-lbl dk-fs" fontSize="36" fontStyle="italic">sₓ</text>
      <text x="845" y="520" className="dk-lbl dk-fi" fontSize="32">x</text>
    </svg>
  );
}

/** Масштаб торы: векторлар бір нүктеден, тор санымен */
export function gridLayout(scale: Scale, vectors: Vec[], W: number, H: number) {
  const cells = (v: Vec) => v.mag / scale.cell;
  const r = Math.max(0, ...vectors.filter((v) => v.dir === 'right').map(cells)), l = Math.max(0, ...vectors.filter((v) => v.dir === 'left').map(cells));
  const u = Math.max(0, ...vectors.filter((v) => v.dir === 'up').map(cells)), d = Math.max(0, ...vectors.filter((v) => v.dir === 'down').map(cells));
  const c = Math.min(130, (W - 160) / (l + r + 1.5), (H - 150) / (u + d + 1.5));
  const ox = (W - (l + r) * c) / 2 + l * c, oy = (H - (u + d) * c) / 2 + u * c + 10;
  return { c, ox, oy, end: (v: Vec) => { const k = cells(v) * c; return v.dir === 'right' ? [ox + k, oy] : v.dir === 'left' ? [ox - k, oy] : v.dir === 'up' ? [ox, oy - k] : [ox, oy + k]; } };
}

function VectorGrid({ scale, vectors, shown }: { scale: Scale; vectors: Vec[]; shown: number }) {
  const W = 1000, H = 720, g = gridLayout(scale, vectors, W, H);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-label="Масштаб бойынша векторлар">
      <defs><pattern id={`dk-gv${g.c | 0}`} width={g.c} height={g.c} x={g.ox} y={g.oy} patternUnits="userSpaceOnUse"><path d={`M${g.c} 0H0V${g.c}`} fill="none" className="dk-sg" strokeWidth="2" /></pattern></defs>
      <rect width={W} height={H} fill={`url(#dk-gv${g.c | 0})`} />
      <rect x={W - 60 - g.c} y={H - 40 - g.c} width={g.c} height={g.c} className="dk-fa" opacity=".16" /><rect x={W - 60 - g.c} y={H - 40 - g.c} width={g.c} height={g.c} fill="none" className="dk-sa" strokeWidth="4" />
      <text x={W - 80 - g.c} y={H - 40 - g.c / 2 + 11} textAnchor="end" className="dk-lbl dk-fa" fontSize="32">1 тор = {scale.cell} {scale.unit}</text>
      {vectors.map((v, i) => {
        const [x, y] = g.end(v), cls = i % 2 ? 's' : 'v', len = Math.hypot(x - g.ox, y - g.oy), on = i < shown;
        const ang = Math.atan2(y - g.oy, x - g.ox), hx = x + Math.cos(ang) * 30, hy = y + Math.sin(ang) * 30;
        const p = (a: number, r: number) => `${x + Math.cos(ang + a) * r},${y + Math.sin(ang + a) * r}`;
        const horiz = v.dir === 'right' || v.dir === 'left';
        return (
          <g key={i} className={`dk-step${on ? ' dk-in' : ''}`}>
            <line x1={g.ox} y1={g.oy} x2={x} y2={y} className={`dk-s${cls}${on ? ' dk-draw' : ''}`} style={{ '--len': len } as CSSProperties} strokeWidth="12" strokeLinecap="round" />
            <polygon points={`${hx},${hy} ${p(2.6, 30)} ${p(-2.6, 30)}`} className={`dk-f${cls}`} />
            <text x={horiz ? (g.ox + x) / 2 : x + 26} y={horiz ? y + 56 : (g.oy + y) / 2} textAnchor={horiz ? 'middle' : 'start'} className={`dk-lbl dk-f${cls}`} fontSize="40">{v.name} = {v.mag} {scale.unit}</text>
          </g>
        );
      })}
      <circle cx={g.ox} cy={g.oy} r="14" className="dk-fi" />
      <text x={g.ox - 22} y={g.oy + 44} textAnchor="end" className="dk-lbl dk-fi" fontSize="30">O</text>
    </svg>
  );
}

function Track({ run }: { run: boolean }) {
  const path = useRef<SVGPathElement>(null), [t, setT] = useState(0);
  useEffect(() => {
    if (!run) { setT(0); return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setT(1); return; }
    let raf = 0; const t0 = performance.now();
    const f = (now: number) => { const x = Math.min(1, (now - t0) / 6000); setT(x); if (x < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [run]);
  const P = path.current, L = P?.getTotalLength() || 2400, pt = P ? P.getPointAtLength(t * L) : { x: 540, y: 600 };
  const d = Math.round(t >= 1 ? 0 : Math.hypot(pt.x - 540, pt.y - 600) * 400 / L);
  const D = 'M540 600 H310 A250 250 0 0 1 310 100 H770 A250 250 0 0 1 770 600 Z';
  return (
    <svg viewBox="0 0 1080 720" aria-label="Стадион жолы және спортшы">
      <rect x="60" y="100" width="960" height="500" rx="250" fill="none" className="dk-sg" strokeWidth="70" />
      <path ref={path} d={D} fill="none" />
      <path d={D} fill="none" className="dk-ss" strokeWidth="12" strokeLinecap="round" style={{ strokeDasharray: L, strokeDashoffset: L * (1 - t) }} />
      <line x1="540" y1="600" x2={pt.x} y2={pt.y} className="dk-sv" strokeWidth="12" strokeLinecap="round" />
      <rect x="532" y="550" width="16" height="100" className="dk-fi" opacity=".8" />
      <text x="565" y="560" className="dk-lbl dk-fi" fontSize="30">Старт · Мәре</text>
      <circle cx={pt.x} cy={pt.y} r="24" className="dk-fa dk-runner" strokeWidth="6" />
      <g className="dk-meters">
        <text x="300" y="300" className="dk-lbl dk-fs" fontSize="34">Жол</text>
        <text x="300" y="370" className="dk-lbl dk-fs dk-big" fontSize="72">{Math.round(t * 400)} м</text>
        <text x="610" y="300" className="dk-lbl dk-fv" fontSize="34">Орын ауыстыру</text>
        <text x="610" y="370" className="dk-lbl dk-fv dk-big" fontSize="72">{d} м</text>
      </g>
    </svg>
  );
}

function Hand({ n }: { n: number }) {
  return <svg viewBox="0 0 60 60" aria-hidden><circle cx="30" cy="30" r="28" className={n % 2 ? 'dk-fs' : 'dk-fv'} opacity=".14" /><text x="30" y="41" textAnchor="middle" className={`dk-lbl ${n % 2 ? 'dk-fs' : 'dk-fv'}`} fontSize="30">{n + 1}</text></svg>;
}

/* ───────── мәтін: **қалың** ───────── */
function Rich({ t }: { t: string }) {
  const parts = t.split(/\*\*(.+?)\*\*/g);
  return <span className="dk-rt">{parts.map((p, i) => (i % 2 ? <b key={i}><Sub t={p} /></b> : <Sub key={i} t={p} />))}</span>;
}

/** Физикалық белгілердің төменгі индексі: X_L, υ_орт, E_{k} → <sub> */
const SUB = /(?<=[\p{L}\p{N})])_(\{[^}]*\}|[\p{L}\p{N}]+)/gu;
function Sub({ t }: { t: string }) {
  const out: React.ReactNode[] = []; let last = 0;
  for (const m of t.matchAll(SUB)) {
    out.push(t.slice(last, m.index), <sub key={m.index}>{m[1].replace(/^\{|\}$/g, '')}</sub>);
    last = m.index! + m[0].length;
  }
  out.push(t.slice(last));
  return <>{out}</>;
}

const hasVisual = (v: Visual) => !!(v.img || v.cards || v.flow || v.chart || (v.illus && ILLUS.has(v.illus.k)));

function VisualView({ v }: { v: Visual }) {
  if (v.illus && ILLUS.has(v.illus.k)) return <Illus s={v.illus} />;
  if (v.cards) {
    const n = v.cards.items.length, cols = n === 4 || n === 2 ? 2 : 3;
    return (
      <div className="dk-vcards">
        <b className="dk-vtitle">{v.cards.title}</b>
        <div style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {v.cards.items.map(([h, b], i) => <div key={i} className={`dk-vcard dk-c${i % 6}`} style={{ animationDelay: `${0.15 + i * 0.12}s` }}><b>{h}</b><span>{b}</span></div>)}
        </div>
      </div>
    );
  }
  if (v.flow) {
    return (
      <div className="dk-vflow">
        <b className="dk-vtitle">{v.flow.title}</b>
        <div>{v.flow.items.map((t, i) => <span key={i} className={`dk-c${i % 6}`} style={{ animationDelay: `${0.15 + i * 0.2}s` }}>{t}</span>)}</div>
      </div>
    );
  }
  if (v.chart) return <ChartView c={v.chart} />;
  if (v.img) return <img className="dk-img" src={v.img.svg} alt="" draggable={false} />;
  return null;
}

/** График: сызық немесе бағана, біртіндеп «сызылады» */
function ChartView({ c }: { c: Chart }) {
  const W = 900, H = 600, L = 110, R = 30, T = 70, B = 90;
  const all = c.series.flatMap((s) => s.values), max0 = Math.max(0, ...all), min = Math.min(0, ...all);
  const step = niceStep((max0 - min) / 5), max = Math.ceil(max0 / step) * step || step;
  const x = (i: number) => c.type === 'bar' ? L + ((i + 0.5) * (W - L - R)) / c.labels.length : L + (i * (W - L - R)) / Math.max(1, c.labels.length - 1);
  const y = (v: number) => T + ((max - v) * (H - T - B)) / (max - min || 1);
  const ticks: number[] = []; for (let v = min; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(6));
  const every = Math.ceil(c.labels.length / 12);
  const bw = ((W - L - R) / c.labels.length) * 0.7 / c.series.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dk-chart" aria-label={c.title}>
      {ticks.map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="dk-sg" strokeWidth="2" /><text x={L - 14} y={y(v) + 9} textAnchor="end" className="dk-ax">{fmt(v)}</text></g>)}
      <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} className="dk-si" strokeWidth="3" />
      <line x1={L} x2={L} y1={T - 10} y2={H - B} className="dk-si" strokeWidth="3" />
      {c.labels.map((l, i) => i % every === 0 && <text key={i} x={x(i)} y={H - B + 36} textAnchor="middle" className="dk-ax">{l}</text>)}
      <text x={(L + W - R) / 2} y={H - 18} textAnchor="middle" className="dk-ax dk-axl">{c.xl}</text>
      <text x={L - 4} y={T - 30} textAnchor="start" className="dk-ax dk-axl">{c.yl}</text>
      {c.series.map((s, k) => c.type === 'bar'
        ? <g key={k} className={`dk-ser dk-ser${k}`}>{s.values.map((v, i) => <rect key={i} x={x(i) - (bw * c.series.length) / 2 + k * bw} width={bw - 4} y={Math.min(y(v), y(0))} height={Math.abs(y(v) - y(0))} rx="6" className="dk-bar" style={{ animationDelay: `${i * 0.06}s` }} />)}</g>
        : <g key={k} className={`dk-ser dk-ser${k}`}>
            <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" className="dk-draw" pathLength={1} style={{ '--len': 1, animationDelay: `${k * 0.4}s` } as CSSProperties} />
            {s.values.length < 14 && s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="9" className="dk-dot" />)}
          </g>)}
      {c.series.length > 1 && <g>{c.series.map((s, k) => <g key={k} transform={`translate(${W - R - (c.series.length - k) * 250} ${T - 40})`} className={`dk-ser${k}`}><rect width="28" height="10" y="-8" rx="5" className="dk-bar" /><text x="38" y="2" className="dk-ax">{s.name}</text></g>)}</g>}
    </svg>
  );
}
function niceStep(r: number) { const p = 10 ** Math.floor(Math.log10(r || 1)), m = r / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
const fmt = (v: number) => (Math.abs(v) >= 1000 ? v.toLocaleString('ru-RU') : String(+v.toFixed(3))).replace('.', ',');

function HookArt() {
  return (
    <svg className="dk-hookart" viewBox="0 0 500 500" aria-hidden>
      <circle cx="250" cy="250" r="200" className="dk-sg" fill="none" strokeWidth="3" strokeDasharray="6 14" />
      <g className="dk-float"><text x="250" y="330" textAnchor="middle" className="dk-lbl dk-fa" fontSize="280">?</text></g>
      <circle cx="120" cy="140" r="16" className="dk-fs" /><circle cx="390" cy="380" r="22" className="dk-fv" opacity=".5" /><circle cx="400" cy="120" r="10" className="dk-fv" />
    </svg>
  );
}

function BreakArt() {
  return <svg className="dk-breakart" viewBox="0 0 200 200" aria-hidden><circle cx="100" cy="100" r="90" className="dk-fa" opacity=".12" /><g className="dk-float"><circle cx="100" cy="58" r="20" className="dk-fa" /><path d="M100 82v52M100 134l-28 40M100 134l28 40M60 96l40 10 40-10" className="dk-sa" strokeWidth="12" strokeLinecap="round" fill="none" /></g></svg>;
}

const EQUIP: [RegExp, string][] = [
  [/сызғыш|рулетка/, 'M3 16 16 3l5 5L8 21zM7 12l2 2M10 9l2 2M13 6l2 2'],
  [/мензурка|цилиндр|стакан|стақан|ыдыс|колба/, 'M8 3h8M9 3v6L5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-4-10V3M7 15h10'],
  [/термометр/, 'M14 14V5a2 2 0 0 0-4 0v9a4 4 0 1 0 4 0zM12 9v6'],
  [/секундомер|сағат/, 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M10 2h4'],
  [/динамометр|серіппе/, 'M12 2v3M8 5h8l-6 3 6 3-6 3 6 3H8M12 17v5'],
  [/таразы|гир/, 'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8'],
  [/амперметр|вольтметр|мультиметр|гальванометр/, 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 12l4-4M8 16h8'],
  [/батарея|ток көзі|аккумулятор/, 'M3 8h16v8H3zM19 11h2v2h-2M7 12h4M9 10v4'],
  [/шам|лампа/, 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3z'],
  [/магнит/, 'M5 4v8a7 7 0 0 0 14 0V4h-4v8a3 3 0 0 1-6 0V4z'],
  [/линза|айна|экран|призма/, 'M12 3c3 4 3 14 0 18-3-4-3-14 0-18z'],
  [/сым|кілт|реостат|резистор/, 'M2 12h4l2-4 3 8 3-8 3 8 2-4h3'],
];
function EquipIcon({ name }: { name: string }) {
  const d = (EQUIP.find(([r]) => r.test(name.toLowerCase())) || [null, 'M4 7h16v12H4zM9 7V4h6v3'])[1];
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

function AtomArt({ small }: { small?: boolean }) {
  return (
    <svg className={`dk-titleart${small ? ' dk-titleart--sm' : ''}`} viewBox="0 0 760 760" aria-hidden>
      <g className="dk-spin">
        {[0, 60, 120].map((r, k) => <ellipse key={r} cx="380" cy="380" rx="300" ry="114" transform={`rotate(${r} 380 380)`} fill="none" className={['dk-sv', 'dk-ss', 'dk-sa'][k]} strokeWidth="10" />)}
        <circle r="18" className="dk-fs"><animateMotion dur="5s" repeatCount="indefinite" path="M680 380a300 114 0 1 1-600 0a300 114 0 1 1 600 0" /></circle>
      </g>
      <circle cx="380" cy="380" r="44" className="dk-fv" />
    </svg>
  );
}
