/* v3 көрнекі слайдтар: бір слайд = бір ой. Үлкен анимациялы сурет, қысқа мәтін, ірі қаріп.
   Әдіс нұсқаулығы (ребус, ыстық картоп т.б.) экранда емес — slide.notes ішінде. */
import type { CSSProperties, ReactNode } from 'react';
import type { Slide } from '../types';
import Art, { type ArtId } from './Art';

export const V3 = new Set(['cover', 'ask', 'aims', 'trio', 'idea', 'bigf', 'poll', 'myth', 'job', 'sum', 'home', 'stars', 'bye']);

const In = ({ on, children, className = '', style }: { on: boolean; children: ReactNode; className?: string; style?: CSSProperties }) =>
  <div className={`dk-step${on ? ' dk-in' : ''} ${className}`} style={style}>{children}</div>;

const A = ({ id, className, meet }: { id?: string; className?: string; meet?: boolean }) => (id ? <Art id={id as ArtId} className={className} meet={meet} /> : null);

/** **қалың** белгісі */
function T({ t }: { t: string }) {
  return <>{t.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))}</>;
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
              <h1 className={s.title.length > 44 ? 'x-h1 x-h1--s' : 'x-h1'}>{s.title}</h1>
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
              <h2 className="x-h2">{s.q}</h2>
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
              <p className="x-text"><T t={s.text} /></p>
              {!!s.chips?.length && <In on={step > 0} className="x-chips">{s.chips.map((c) => <span key={c}>{c}</span>)}</In>}
            </div>
          </div>
        );
      case 'bigf':
        return (
          <div className="x-pad x-center">
            {tag}
            <h2 className="x-h2">{s.title}</h2>
            <div className="x-f">{s.f}</div>
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
              <h2 className="x-h2">{s.q}</h2>
            </div>
            {s.art && <div className="x-poll__art"><A id={s.art} meet /></div>}
            <div className="x-opts">
              {s.opts.map((o, i) => (
                <div key={i} className={`x-opt${step > 0 ? (i === s.ok ? ' x-opt--ok' : ' x-opt--off') : ''}`}><b>{'ABCD'[i]}</b><span>{o}</span></div>
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
            <h2 className="x-h2">{s.title}</h2>
            <div className="x-stars">
              {s.items.map((t, i) => (
                <div key={i} className={`x-star${i === s.items.length - 1 ? ' x-star--wish' : ''}`}>
                  <svg viewBox="0 0 100 100" aria-hidden>{i === s.items.length - 1
                    ? <path d="M50 12c12 18 30 26 30 44a30 30 0 0 1-60 0c0-18 18-26 30-44z" />
                    : <path d="M50 6l13 28 30 3-23 20 7 30-27-16-27 16 7-30L7 37l30-3z" />}</svg>
                  <p>{t}</p>
                </div>
              ))}
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
