import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from '../../lib/account';
import { CONFIG, labOf } from '../../lib/config';
import { KIND_LABEL, downloadFile, type Kind, type Lesson } from '../../lib/data';
import { useOnline } from '../../lib/offline';
import { canPickFolder, saveToUsb } from '../../lib/usb';
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
      {!brief && ok && <UsbAct l={l} />}
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

/** «Флешкаға жазу»: сабақтың бәрін (презентация, сценарий, парақ, видео, 3D тәжірибе) флешкаға папка етіп жазу —
    мектептегі тақтада интернетсіз, кабинетке кірусіз «Сабақты ашу.html» арқылы ашылады */
export function UsbAct({ l }: { l: Lesson }) {
  const online = useOnline();
  const toast = useToast();
  const [k, setK] = useState<number | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const run = async () => {
    setK(0); setDone(null);
    const r = await saveToUsb(l, setK);
    setK(null);
    if (r.ok) { setDone(r.where); toast(r.zip ? 'ZIP жүктелді: флешкаға көшіріп, «Барлығын шығару» (Extract) жасаңыз' : 'Флешкаға жазылды: тақтада «Сабақты ашу.html» файлын ашыңыз'); }
    else if (!r.cancelled) toast(r.error);
  };
  if (k !== null) return (
    <span className="act act--wide act--off is-busy" role="status"><IcBusy className="spin" />Жазылуда… {Math.round(k * 100)}%<i className="act__bar"><b style={{ width: `${k * 100}%` }} /></i></span>
  );
  return (
    <button className={`act act--wide act--off${done ? ' is-ready' : ''}`} type="button" onClick={run} disabled={!online}
      title={done ? `Жазылды: ${done}` : canPickFolder() ? 'Флешканы (немесе ондағы папканы) таңдаңыз — сабақ жеке папка болып жазылады' : 'Сабақ ZIP болып жүктеледі — оны флешкаға көшіріңіз'}>
      {done ? <IcDone /> : <IcUsb />}{done ? 'Флешкада бар · қайта жазу' : 'Флешкаға жазу'}
    </button>
  );
}

const IcUsb = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 2h8v6H8zM6 8h12v9a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM10 4.5h.01M14 4.5h.01" /></svg>;
