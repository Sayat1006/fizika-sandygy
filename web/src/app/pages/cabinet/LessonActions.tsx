import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from '../../lib/account';
import { CONFIG, labOf } from '../../lib/config';
import { KIND_LABEL, downloadFile, type Kind, type Lesson } from '../../lib/data';
import { lessonKey, lessonOfflineSupported, mb, removeLessonOffline, saveLessonOffline, useOnline, useSavedLessons } from '../../lib/offline';
import { IcBoard, IcBusy, IcDone, IcEye, IcLab, IcLock, KindIcon } from '../../ui/icons';
import { useToast } from '../../ui/kit';

/** Сабақтың әрекеттері: тақтада ашу, 3D тәжірибе, қарау, файлдарды жүктеу. Жазылымсыз — құлып. */
export default function LessonActions({ l, grade, onView, onLock, layout = 'grid', noView, compact, brief }: {
  l: Lesson; grade: number; onView: (l: Lesson) => void; onLock: (grade: number) => void; layout?: 'grid' | 'row'; noView?: boolean;
  /** кең экранның карточкасы: жүктеу мен қарау оң жақтағы панельде */ compact?: boolean;
  /** телефондағы апта карточкасы: «Тақтада ашу» мен «Қарау» (жүктеу — қарау терезесінде) */ brief?: boolean;
}) {
  const { subOf } = useAccount();
  const ok = !!subOf(grade), lab = labOf(l);
  const kinds = (['kmzh', 'pres', 'ws', 'sa'] as Kind[]).filter((k) => l[k]);
  if (compact) return null; // кең экран: карточка тек таңдау үшін, әрекеттер оң жақтағы панельде
  return (
    <div className={`acts acts--${layout}`}>
      {ok
        ? <Link className="act act--primary act--wide" to={`/board?v=${encodeURIComponent(l.v)}&n=${l.n}`}><IcBoard />Тақтада ашу</Link>
        : <button className="act act--lock act--wide" type="button" onClick={() => onLock(grade)}><IcLock />Тақтада ашу</button>}
      {lab?.exp && <a className="act act--dark act--wide" href={`/lab/experiments/${lab.exp}`}><IcLab />3D тәжірибе</a>}
      {compact ? null : <>
      {!noView && <button className="act" type="button" onClick={() => onView(l)}><IcEye />Қарау</button>}
      {!brief && kinds.map((k) => ok ? <DownloadAct key={k} l={l} kind={k} /> : (
        <button key={k} className="act act--lock" type="button" title="Жазылыммен ашылады" onClick={() => onLock(grade)}><IcLock />{KIND_LABEL[k]}</button>
      ))}
      {!brief && ok && <OfflineAct l={l} />}
      </>}
    </div>
  );
}

/** «Офлайнға сақтау»: осы сабақтың бәрін (презентация, сценарий, парақ, видео, 3D тәжірибе) құрылғыға жүктеу —
    сыныпта интернет болмаса да тақтада ашылады */
export function OfflineAct({ l }: { l: Lesson }) {
  const saved = useSavedLessons()[lessonKey(l)];
  const online = useOnline();
  const toast = useToast();
  const [k, setK] = useState<number | null>(null);
  if (!lessonOfflineSupported()) return null;
  const run = async () => {
    setK(0);
    const r = await saveLessonOffline(l, setK);
    setK(null);
    toast(r.ok ? `Сақталды${r.bytes ? ` (${mb(r.bytes)})` : ''}: сабақ интернетсіз де тақтада ашылады` : r.error);
  };
  if (k !== null) return (
    <span className="act act--wide act--off is-busy" role="status"><IcBusy className="spin" />Сақталуда… {Math.round(k * 100)}%<i className="act__bar"><b style={{ width: `${k * 100}%` }} /></i></span>
  );
  if (saved) return (
    <span className="act act--wide act--off is-ready" title={`Сақталған: ${new Date(saved.at).toLocaleDateString('ru-RU')}`}>
      <IcDone />Офлайн дайын
      {online && <button type="button" className="act__mini" onClick={run} title="Жаңарту">Жаңарту</button>}
      <button type="button" className="act__mini" onClick={() => { if (confirm('Осы сабақтың офлайн көшірмесі өшірілсін бе?')) void removeLessonOffline(l); }} title="Құрылғыдан өшіру">Өшіру</button>
    </span>
  );
  return (
    <button className="act act--wide act--off" type="button" onClick={run} disabled={!online} title="Сабақтың материалдарын осы құрылғыға жүктеу — интернетсіз ашылады">
      <IcOffline />Офлайнға сақтау
    </button>
  );
}

const IcOffline = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v11m0 0-4-4m4 4 4-4" /><path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" /></svg>;

export function DownloadAct({ l, kind, big }: { l: Lesson; kind: Kind; big?: boolean }) {
  const { got, markGot } = useAccount();
  const toast = useToast();
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const key = `${l.v}|${l.n}|${kind}`, Ic = KindIcon[kind];
  const run = async () => {
    setState('busy');
    try {
      const left = await downloadFile(l.v, l.n, kind); markGot(key); setState('done'); setTimeout(() => setState('idle'), 2200);
      if (left !== null) toast(left > 0 ? `Тегін кезең: тағы ${left} файл жүктеуге болады` : `Тегін кезеңдегі ${CONFIG.trialFiles} файлдың соңғысы жүктелді`);
    }
    catch (e) { toast((e as Error).message); setState('idle'); }
  };
  const cls = big ? 'btn btn--lg btn--primary' : `act${got.has(key) ? ' act--got' : ''}${state === 'done' ? ' act--done' : ''}`;
  return (
    <button className={cls} type="button" onClick={run} disabled={state === 'busy'} title={got.has(key) ? 'Бұрын жүктелген' : 'Жүктеу'}>
      {state === 'busy' ? <IcBusy className="spin" /> : state === 'done' ? <IcDone /> : <Ic />}
      {KIND_LABEL[kind]}{big ? ' жүктеу' : ''}
    </button>
  );
}
