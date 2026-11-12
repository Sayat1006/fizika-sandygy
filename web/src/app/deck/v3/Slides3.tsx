/* v3 көрнекі слайдтар: бір слайд = бір ой. Үлкен анимациялы сурет, қысқа мәтін, ірі қаріп.
   Әдіс нұсқаулығы (ребус, ыстық картоп т.б.) экранда емес — slide.notes ішінде. */
import type { CSSProperties, ReactNode } from 'react';
import type { Slide } from '../types';
import Art, { type ArtId } from './Art';
import Illus from '../Illus';

export const V3 = new Set(['cover', 'ask', 'aims', 'trio', 'idea', 'bigf', 'poll', 'myth', 'job', 'sum', 'home', 'stars', 'bye', 'model']);

const In = ({ on, children, className = '', style }: { on: boolean; children: ReactNode; className?: string; style?: CSSProperties }) =>
  <div className={`dk-step${on ? ' dk-in' : ''} ${className}`} style={style}>{children}</div>;

const A = ({ id, className, meet }: { id?: string; className?: string; meet?: boolean }) => (id ? <Art id={id as ArtId} className={className} meet={meet} /> : null);

/** **қалың** белгісі */
function T({ t }: { t: string }) {
  return <>{t.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <b key={i}><Sub t={p} /></b> : <Sub key={i} t={p} />))}</>;
}
/** c_су, E_{k} → төменгі индекс */
const SUB = /(?<=[\p{L}\p{N})])_(\{[^}]*\}|[\p{L}\p{N}]+)/gu;
function Sub({ t }: { t: string }) {
  const out: ReactNode[] = []; let last = 0;
  for (const m of t.matchAll(SUB)) { out.push(t.slice(last, m.index), <sub key={m.index}>{m[1].replace(/^\{|\}$/g, '')}</sub>); last = m.index! + m[0].length; }
  out.push(t.slice(last));
  return <>{out}</>;
}

const LV = { A: ['Түсінемін', 'a'], B: ['Қолданамын', 'b'], C: ['Талдаймын', 'c'] } as const;

export default function Slide3({ s, step, no }: { s: Slide; step: number; no: number }) {
  const tag = 'tag' in s && s.tag ? <div className="x-tag">{s.tag}</div> : null;
  const body = (() => {
    switch (s.t) {
      case 'cover':
        return (
          <div className="x-cover">
            <A id={s.art} className="x-bleed" />
            <div className="x-cover__veil" />
            <div className="x-cover__txt">
              <div className="x-kicker">{s.kicker}</div>
              <h1 className={s.title.length > 90 ? 'x-h1 x-h1--xs' : s.title.length > 44 ? 'x-h1 x-h1--s' : 'x-h1'}>{s.title}</h1>
              {s.sub && <p className="x-sub">{s.sub}</p>}
            </div>
          </div>
        );
      case 'ask':
        return (
          <div className="x-ask">
            <A id={s.art} className="x-bleed" />
            <div className="x-ask__card">
              <div className="x-q">?</div>
              <h2 className="x-h2"><Sub t={s.q} /></h2>
              {s.answer && <In on={step > 0} className="x-ans"><T t={s.answer} /></In>}
            </div>
          </div>
        );
      case 'aims':
        return (
          <div className="x-pad">
            {tag}
            <h2 className="x-h2">{s.title}</h2>
            <div className="x-aims">
              {s.items.map((t, i) => (
                <In key={i} on={step > i} className="x-aim"><span className="x-aim__n">{i + 1}</span><p><T t={t} /></p></In>
              ))}
            </div>
          </div>
        );
      case 'trio':
      case 'sum': {
        const items = s.t === 'trio' ? s.items : s.items.map((x) => ({ name: '', art: x.art, text: x.text }));
        return (
          <div className="x-pad">
            {tag}
            <h2 className="x-h2">{s.title}</h2>
            <div className="x-trio">
              {items.map((x, i) => (
                <In key={i} on={step > i} className="x-tcard">
                  <div className="x-tcard__art"><A id={x.art} /></div>
                  {x.name && <h3>{x.name}</h3>}
                  <p><T t={x.text} /></p>
                </In>
              ))}
            </div>
          </div>
        );
      }
      case 'idea':
        return (
          <div className={`x-idea${s.flip ? ' x-idea--flip' : ''}`}>
            <div className="x-idea__art"><A id={s.art} /></div>
            <div className="x-idea__txt">
              {s.kicker && <div className="x-kicker">{s.kicker}</div>}
              <h2 className="x-h2">{s.title}</h2>
              {s.text && <p className={`x-text${s.text.length > 150 ? ' x-text--s' : ''}`}><T t={s.text} /></p>}
              {!!s.list?.length && <ul className={`x-list${s.list.join('').length > 220 ? ' x-list--s' : ''}`}>{s.list.map((t, i) => <In key={i} on={step > i} className="x-li"><T t={t} /></In>)}</ul>}
              {!!s.chips?.length && <In on={step > (s.list?.length || 0)} className="x-chips">{s.chips.map((c) => <span key={c}>{c}</span>)}</In>}
            </div>
          </div>
        );
      case 'model':
        return (
          <div className="x-idea x-model">
            <div className="x-idea__art x-model__box"><Illus s={s.illus} /></div>
            <div className="x-idea__txt">
              <div className="x-kicker">{s.kicker || 'Модельмен тексер'}</div>
              <h2 className="x-h2">{s.title}</h2>
              {s.text && <p className="x-text"><T t={s.text} /></p>}
            </div>
          </div>
        );
      case 'bigf':
        return (
          <div className="x-pad x-center">
            {tag}
            <h2 className="x-h2">{s.title}</h2>
            <div className="x-f"><Sub t={s.f} /></div>
            <div className="x-parts">
              {s.parts.map(([sym, name, unit], i) => (
                <In key={i} on={step > i} className="x-part"><b>{sym}</b><span>{name}</span><i>{unit}</i></In>
              ))}
            </div>
          </div>
        );
      case 'poll':
        return (
          <div className={`x-pad x-poll${s.art ? ' x-poll--art' : ''}`}>
            <div className="x-poll__head">
              <div className="x-tag x-tag--poll">Сұрақ</div>
              <h2 className="x-h2"><Sub t={s.q} /></h2>
            </div>
            {s.art && <div className="x-poll__art"><A id={s.art} meet /></div>}
            <div className="x-opts">
              {s.opts.map((o, i) => (
                <div key={i} className={`x-opt${step > 0 ? (i === s.ok ? ' x-opt--ok' : ' x-opt--off') : ''}`}><b>{'ABCD'[i]}</b><span><Sub t={o} /></span></div>
              ))}
            </div>
          </div>
        );
      case 'myth':
        return (
          <div className="x-myth">
            <div className="x-myth__w">
              <div className="x-badge x-badge--no">✕ Қате пікір</div>
              <p className="x-myth__t">{s.wrong}</p>
            </div>
            <In on={step > 0} className="x-myth__r">
              <div className="x-badge x-badge--ok">✓ Шындығында</div>
              <p className="x-myth__t">{s.right}</p>
              <In on={step > 1} className="x-why"><T t={s.why} /></In>
            </In>
          </div>
        );
      case 'job': {
        const [lv, c] = LV[s.level];
        return (
          <div className={`x-job${s.art ? ' x-job--art' : ''}`}>
            <div className="x-job__main">
              <div className={`x-lv x-lv--${c}`}><b>{s.level}</b><span>{lv}</span></div>
              <h2 className={`x-h2 x-job__q${s.q.length > 70 ? ' x-job__q--s' : ''}`}><T t={s.q} /></h2>
              <In on={step > 0} className="x-ans x-ans--job"><small>Жауабы</small><T t={s.answer} /></In>
            </div>
            {s.art && <div className="x-job__art"><A id={s.art} meet /></div>}
          </div>
        );
      }
      case 'home':
        return (
          <div className="x-pad">
            {tag}
            <h2 className="x-h2">{s.title}</h2>
            <div className="x-home">
              {s.items.map(([lv, t], i) => (
                <div key={i} className="x-home__i"><span className={`x-lv x-lv--sm x-lv--${'abc'[i] || 'a'}`}><b>{lv}</b></span><p><T t={t} /></p></div>
              ))}
            </div>
          </div>
        );
      case 'stars':
        return (
          <div className="x-pad x-center">
            {tag}
            <h2 className="x-h2">{s.title}</h2>
            <div className="x-stars" style={{ gridTemplateColumns: `repeat(${s.items.length}, 1fr)` }}>
              {s.items.map((it, i) => {
                const [ic, t] = typeof it === 'string' ? [i === s.items.length - 1 ? 'wish' : 'star', it] : it;
                return <div key={i} className={`x-star${s.items.length > 3 ? ' x-star--sm' : ''}`}><Icon k={ic} /><p>{t}</p></div>;
              })}
            </div>
          </div>
        );
      case 'bye':
        return (
          <div className="x-cover x-bye">
            <A id={s.art} className="x-bleed" />
            <div className="x-cover__veil" />
            <div className="x-cover__txt">
              <h1 className="x-h1">{s.title}</h1>
              {s.quote && <blockquote className="x-quote">«{s.quote.text}»<cite>— {s.quote.by}</cite></blockquote>}
            </div>
          </div>
        );
      default:
        return null;
    }
  })();
  return (
    <div className={`x x--${s.t}`}>
      {body}
      {s.t !== 'cover' && s.t !== 'bye' && <div className="x-no">{no}</div>}
    </div>
  );
}

/** рефлексия белгішелері */
function Icon({ k }: { k: string }) {
  const c = { g: '#17a05d', y: '#ffb020', r: '#e5483a' } as Record<string, string>;
  const [base, mod] = k.split('-');
  const body = (() => {
    switch (base) {
      case 'star': return <path d="M50 6l13 28 30 3-23 20 7 30-27-16-27 16 7-30L7 37l30-3z" fill="#ffc21f" />;
      case 'wish': return <path d="M50 12c12 18 30 26 30 44a30 30 0 0 1-60 0c0-18 18-26 30-44z" fill="#1f8bff" />;
      case 'leaf': return <path d="M20 80C20 40 45 15 85 15c0 40-25 65-65 65zM20 80L60 40" fill={c[mod]} stroke="#fff" strokeWidth="4" />;
      case 'light': return <><rect x="30" y="4" width="40" height="92" rx="20" fill="#2b3245" /><circle cx="50" cy={mod === 'r' ? 24 : mod === 'y' ? 50 : 76} r="14" fill={c[mod]} /></>;
      case 'step': { const n = +mod; return <>{[1, 2, 3].map((j) => <rect key={j} x={8 + (j - 1) * 28} y={84 - j * 24} width="28" height={j * 24} fill={j <= n ? '#1f8bff' : '#c9d1dc'} />)}</>; }
      case 'plus': return <><circle cx="50" cy="50" r="44" fill="#17a05d" /><path d="M50 28v44M28 50h44" stroke="#fff" strokeWidth="10" strokeLinecap="round" /></>;
      case 'minus': return <><circle cx="50" cy="50" r="44" fill="#e5483a" /><path d="M28 50h44" stroke="#fff" strokeWidth="10" strokeLinecap="round" /></>;
      case 'idea': return <><circle cx="50" cy="42" r="30" fill="#ffc21f" /><rect x="38" y="70" width="24" height="18" rx="4" fill="#8a93a3" /></>;
      case 'target': { const n = +mod; return <>{[44, 30, 16].map((r, j) => <circle key={j} cx="50" cy="50" r={r} fill={j === 3 - n ? '#e5483a' : j % 2 ? '#fff' : '#ffd0cc'} stroke="#e5483a" strokeWidth="4" />)}</>; }
      case 'face': return <><circle cx="50" cy="50" r="44" fill={c[mod]} /><circle cx="35" cy="40" r="6" fill="#fff" /><circle cx="65" cy="40" r="6" fill="#fff" />
        <path d={mod === 'g' ? 'M30 60q20 22 40 0' : mod === 'y' ? 'M32 66h36' : 'M30 72q20 -20 40 0'} stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" /></>;
      case 'num': return <><circle cx="50" cy="50" r="44" fill="var(--d-accent)" /><text x="50" y="66" textAnchor="middle" fontSize="48" fontWeight="800" fill="var(--d-on)">{mod}</text></>;
      case 'note': return <><rect x="18" y="8" width="64" height="84" rx="8" fill="#fff" stroke="#8a93a3" strokeWidth="5" /><path d="M30 32h40M30 50h40M30 68h26" stroke="#8a93a3" strokeWidth="6" /></>;
    }
    return null;
  })();
  return <svg viewBox="0 0 100 100" aria-hidden>{body}</svg>;
}
