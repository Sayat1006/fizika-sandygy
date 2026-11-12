import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from '../../lib/account';
import { labOf } from '../../lib/config';
import { KIND_LABEL, downloadFile, type Kind, type Lesson } from '../../lib/data';
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
  const kinds = (['kmzh', 'pres', 'ws'] as Kind[]).filter((k) => l[k]);
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
      </>}
    </div>
  );
}

export function DownloadAct({ l, kind, big }: { l: Lesson; kind: Kind; big?: boolean }) {
  const { got, markGot } = useAccount();
  const toast = useToast();
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const key = `${l.v}|${l.n}|${kind}`, Ic = KindIcon[kind];
  const run = async () => {
    setState('busy');
    try { await downloadFile(l.v, l.n, kind); markGot(key); setState('done'); setTimeout(() => setState('idle'), 2200); }
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
