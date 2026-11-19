import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from '../lib/account';
import { labOf } from '../lib/config';
import { lessonDeck, lessonPlan, loadLessons, viewPages } from '../lib/data';
import { useOnline } from '../lib/offline';
import { videosOf } from '../lib/videos';
import { IcChevronL } from '../ui/icons';
import BoardView, { type BoardData } from './board/BoardView';
import LivePanel from './board/LivePanel';

/* Тақта (сайтта): сабақтың деректерін API-дан жүктеп, BoardView-ға береді. */
export default function Board() {
  const { ready, session } = useAccount();
  const qs = new URLSearchParams(location.search), V = qs.get('v') || '', N = parseInt(qs.get('n') || '', 10), grade = parseInt(V, 10);
  const [fatal, setFatal] = useState<{ title: string; text: string; to: string; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BoardData | null>(null);
  const online = useOnline();

  /* ───────── жүктеу ───────── */
  useEffect(() => {
    if (!ready) return;
    const fail = (title: string, text: string, label = 'Кабинетке') => { setFatal({ title, text, to: '/app', label }); setLoading(false); };
    if (!V || !(N > 0)) return fail('Сабақ таңдалмаған', 'Кабинеттен тақырыпты ашып, «Тақтада ашу» батырмасын басыңыз.');
    if (!session) return fail('Кабинетке кіріңіз', 'Тақта кабинетке кірген мұғалімге ашылады.', 'Кіру');
    let off = false;
    (async () => {
      const all = await loadLessons();
      const l = all.find((x) => x.v === V && x.n === N) || all.find((x) => grade < 10 && x.grade === grade && x.n === N);
      if (!l) return fail('Сабақ табылмады', 'Кабинетке оралып, тақырыпты қайта таңдаңыз.');
      const [plan, pres, ws, dk, vids] = await Promise.all([
        lessonPlan(V, N),
        l.pres ? viewPages(V, N, 'pres').catch(() => null) : null,
        l.ws ? viewPages(V, N, 'ws').catch(() => null) : null,
        lessonDeck(V, N),
        videosOf(V, N, grade),
      ]);
      if (off) return;
      if (plan.status === 402) return fail('Тақта жазылыммен ашылады', `${grade}-сыныпқа жазылым немесе тегін сынақ мерзімі керек.`, 'Жазылымды рәсімдеу');
      if (plan.status === 401) return fail('Сессия аяқталды', 'Кабинетке қайта кіріңіз.', 'Кіру');
      const p = { pres: pres?.pages || [], ws: ws?.pages || [] };
      // интернет нашар болса да слайдтар кідірмеуі үшін бәрін алдын ала жүктеп қоямыз
      [...p.pres, ...p.ws].forEach((u) => { const i = new Image(); i.decoding = 'async'; i.src = u; });
      // анимациялы презентация болса, «Слайд» соны көрсетеді
      const deck = dk?.slides?.length ? dk : null;
      if (deck) p.pres = deck.slides.map((_, k) => `deck:${k}`);
      const exp = labOf({ ...l, v: V })?.exp;
      setData({ lesson: { grade, disp: l.disp, topic: l.topic }, pages: p, deck, stages: plan.stages || [], videos: vids, lab: exp ? `/lab/experiments/${exp}?embed=1` : null });
      document.title = `${l.topic} · Тақта`;
      setLoading(false);
      try { localStorage.setItem('fs-board-opened', '1'); } catch { /* */ }
      try { await (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<unknown> } }).wakeLock?.request('screen'); } catch { /* тақтаның экраны сөніп қалмасын */ }
    })().catch(() => { if (!off) navigator.onLine ? fail('Қате орын алды', 'Бетті жаңартып көріңіз.') : fail('Интернет жоқ', 'Бұл сабақ құрылғыға сақталмаған. Интернет бар кезде кабинетте сабақтың «Офлайнға сақтау» батырмасын басыңыз.'); });
    return () => { off = true; };
  }, [ready, session?.access_token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (fatal || loading || !data) {
    return (
      <div className="bd bd--msg">
        {loading && !fatal ? (
          <div className="bd-skel" aria-label="Сабақ жүктелуде">
            <div className="bd-skel__top"><i /><b /><em /></div>
            <div className="bd-skel__stage"><span>Сабақ жүктелуде…</span></div>
            <div className="bd-skel__tools"><i /><i /><i /></div>
          </div>
        ) : fatal && (
          <div className="bd-msg"><b>{fatal.title}</b><span>{fatal.text}</span><Link className="bd-pill" to={fatal.to}>{fatal.label}</Link></div>
        )}
      </div>
    );
  }

  return (
    <BoardView data={data} back={<Link className="bd-ib" to="/app" aria-label="Кабинетке оралу"><IcChevronL /></Link>}
      livePanel={(p) => <LivePanel {...p} />}
      banner={!online && <div className="bd-offline" role="status">Интернет жоқ — сақталған нұсқа ашық. Оқушылардың телефоны қосылмайды.</div>} />
  );
}
