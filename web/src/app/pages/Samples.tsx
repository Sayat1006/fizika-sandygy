import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONFIG, VARIANT } from '../lib/config';
import { money, type Kind } from '../lib/data';
import { IcChevronL, IcChevronR } from '../ui/icons';
import { Segmented } from '../ui/kit';
import { Footer, Nav } from '../ui/Layout';

type Page = [string, number, number];
interface File { file: string; name: string; size: number; pages: Page[] }
interface Sample { grade: number; n: number; disp: string; topic: string; bolim: string; v?: string; kmzh?: File; pres?: File; ws?: File }

const NAMES: Record<Kind, string> = { kmzh: 'ҚМЖ', pres: 'Презентация', ws: 'Жұмыс парағы' };
const kb = (n: number) => (n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' МБ' : Math.round(n / 1024) + ' КБ');
const fromHash = () => { const m = location.hash.match(/^#g(\d+)$/); return m ? +m[1] : 8; };

/** /samples — тіркелусіз тегін үлгілер: әр сыныптан бір сабақ */
export default function Samples() {
  const [all, setAll] = useState<Sample[] | null>(null);
  const [err, setErr] = useState(false);
  const [grade, setGrade] = useState(fromHash);
  const [kind, setKind] = useState<Kind>('kmzh');
  const [slide, setSlide] = useState(0);
  useEffect(() => { fetch('/samples/samples.json').then((r) => r.json()).then(setAll).catch(() => setErr(true)); }, []);
  useEffect(() => { const f = () => { setGrade(fromHash()); setSlide(0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  const cur = all?.find((s) => s.grade === grade) || all?.[0];
  const k: Kind = cur && cur[kind] ? kind : 'kmzh';
  const pick = (g: number) => { setGrade(g); setSlide(0); history.replaceState(null, '', '#g' + g); };

  return (
    <div className="shell">
      <Nav><Link className="nav__link" to="/">Басты бет</Link><Link className="btn btn--sm btn--primary" to="/app">Кабинет</Link></Nav>
      <main className="container">
        <section className="samples-head">
          <span className="chip rise">Тіркелусіз · Тегін</span>
          <h1 className="t-title rise rise-1">Алдымен көріп алыңыз.</h1>
          <p className="t-sub rise rise-2">Әр сыныптан бір сабақтың толық ҚМЖ-сы, презентациясы мен жұмыс парағы.</p>
          {all && <div className="rise rise-3"><Segmented label="Сынып" value={cur!.grade} onChange={pick} items={all.map((s) => ({ value: s.grade, label: `${s.grade}-сынып` }))} /></div>}
        </section>

        {err && <div className="empty">Үлгілерді жүктеу мүмкін болмады. Бетті жаңартыңыз.</div>}
        {!all && !err && <div className="skel" style={{ height: 480 }} />}
        {cur && (
          <section aria-live="polite" className="page-enter" key={cur.grade}>
            <div className="lessonbar">
              <div>
                <span className="t-small">{cur.grade}-сынып{cur.v && VARIANT[cur.v]?.dir ? ' · ' + VARIANT[cur.v].short : ''} · №{cur.disp} сабақ · {cur.bolim}</span>
                <h2>{cur.topic}</h2>
              </div>
            </div>
            <div className="viewbar">
              <Segmented label="Материал" value={k} onChange={(x) => { setKind(x); setSlide(0); }} items={(['kmzh', 'pres', 'ws'] as Kind[]).filter((x) => cur[x]).map((x) => ({ value: x, label: NAMES[x] }))} />
              <span className="viewbar__r">
                <span className="t-small">{k === 'pres' ? `${Math.min(slide, cur.pres!.pages.length - 1) + 1} / ${cur.pres!.pages.length} слайд` : `${cur[k]!.pages.length} бет`}</span>
                <a className="btn btn--sm btn--primary" href={`/samples/${cur.grade}/${cur[k]!.file}`} download={cur[k]!.name}>{NAMES[k]} жүктеу <small>{kb(cur[k]!.size)}</small></a>
              </span>
            </div>
            {k === 'pres' ? <Deck base={`/samples/${cur.grade}/`} pages={cur.pres!.pages} i={Math.min(slide, cur.pres!.pages.length - 1)} go={setSlide} />
              : <div className="pages">{cur[k]!.pages.map(([n, w, h], i) => <img key={n} src={`/samples/${cur.grade}/${n}`} width={w} height={h} alt={`${NAMES[k]}, ${i + 1}-бет`} loading={i ? 'lazy' : 'eager'} decoding="async" />)}</div>}
          </section>
        )}

        <section className="cta-end">
          <h2 className="t-title">Ұнады ма? 3 күн тегін.</h2>
          <p className="t-sub">Тіркелсеңіз, 3 күн бойы барлық сыныптың материалдары мен интерактивті тақта ашық. Кейін бір сыныпқа айына {money(CONFIG.prices.month)}, жылына {money(CONFIG.prices.year)}.</p>
          <Link className="btn btn--lg btn--primary" to="/app?signup">3 күн тегін бастау</Link>
          <p className="t-small">Үлгілерді өз сабағыңызда еркін қолдана беріңіз. Ақылы материалдарды таратуға рұқсат жоқ.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Deck({ base, pages, i, go }: { base: string; pages: Page[]; i: number; go: (n: number) => void }) {
  const to = (n: number) => go(Math.max(0, Math.min(pages.length - 1, n)));
  const thumbs = useRef<HTMLDivElement>(null);
  const sx = useRef<number | null>(null);
  useEffect(() => {
    const t = thumbs.current?.querySelector<HTMLElement>('[aria-current="true"]');
    if (t && thumbs.current) thumbs.current.scrollTo({ left: Math.max(0, t.offsetLeft - thumbs.current.clientWidth / 2 + t.clientWidth / 2), behavior: 'smooth' });
  }, [i]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') to(i + 1); if (e.key === 'ArrowLeft') to(i - 1); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  });
  const [n, w, h] = pages[i];
  return (
    <div>
      <div className="deck" onTouchStart={(e) => { sx.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (sx.current === null) return; const dx = e.changedTouches[0].clientX - sx.current; sx.current = null; if (Math.abs(dx) > 40) to(i + (dx < 0 ? 1 : -1)); }}>
        <img src={base + n} width={w} height={h} alt={`Слайд ${i + 1}`} />
        <button className="deck__arrow deck__arrow--l" type="button" aria-label="Алдыңғы слайд" disabled={i === 0} onClick={() => to(i - 1)}><IcChevronL /></button>
        <button className="deck__arrow deck__arrow--r" type="button" aria-label="Келесі слайд" disabled={i === pages.length - 1} onClick={() => to(i + 1)}><IcChevronR /></button>
      </div>
      <div className="thumbs" ref={thumbs}>
        {pages.map(([p], k) => <button key={p} type="button" aria-current={k === i} aria-label={`${k + 1}-слайд`} onClick={() => to(k)}><img src={base + p} alt="" loading="lazy" decoding="async" /></button>)}
      </div>
    </div>
  );
}
