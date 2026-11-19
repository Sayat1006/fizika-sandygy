import { useEffect, useState } from 'react';
import { downloadLab, fetchManifest, isCached, offlineSupported, savedVersion, type LabPack } from '../../shared/labOffline';

type St = 'check' | 'idle' | 'loading' | 'ready' | 'update' | 'error' | 'na';

/** «Офлайн режимге жүктеу»: зертханалық жұмыстарды интернетсіз ашу үшін алдын ала сақтау */
export default function OfflinePack({ compact }: { compact?: boolean }) {
  const [st, setSt] = useState<St>('check');
  const [pack, setPack] = useState<LabPack | null>(null);
  const [k, setK] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => { const a = () => setOnline(true), b = () => setOnline(false); addEventListener('online', a); addEventListener('offline', b); return () => { removeEventListener('online', a); removeEventListener('offline', b); }; }, []);
  useEffect(() => {
    if (!offlineSupported()) return setSt('na');
    let off = false;
    (async () => {
      const p = await fetchManifest();
      if (off) return;
      if (!p) return setSt(savedVersion() ? 'ready' : 'idle'); // интернет жоқ: бұрын жүктелгенін көрсетеміз
      setPack(p);
      const cached = await isCached(p);
      if (off) return;
      setSt(cached ? 'ready' : savedVersion() ? 'update' : 'idle');
    })();
    return () => { off = true; };
  }, []);
  const go = async () => {
    const p = pack || await fetchManifest(); if (!p) return setSt('error');
    setPack(p); setSt('loading'); setK(0);
    setSt((await downloadLab(p, setK)) ? 'ready' : 'error');
  };
  if (st === 'na' || st === 'check') return null;
  const ready = st === 'ready';
  return (
    <div className={`offpack${ready ? ' is-ready' : ''}${compact ? ' offpack--compact' : ''}`} role="status">
      <span className="offpack__ic" aria-hidden>{ready ? '✓' : st === 'loading' ? Math.round(k * 100) + '%' : '⬇'}</span>
      <div className="offpack__b">
        <strong>{ready ? 'Офлайн режим дайын' : st === 'update' ? 'Офлайн нұсқаны жаңарту керек' : 'Интернетсіз жұмыс істеу'}</strong>
        <span>{ready ? 'Барлық зертханалық жұмыстар осы құрылғыда сақталды — интернет үзілсе де ашылады.'
          : st === 'loading' ? 'Жүктелуде… бетті жаппаңыз.'
          : st === 'error' ? 'Жүктеу аяқталмады. Интернетті тексеріп, қайталаңыз.'
          : `Зертханалық жұмыстарды алдын ала жүктеп қойыңыз${pack?.bytes ? ` (≈ ${(pack.bytes / 1048576).toFixed(1).replace('.', ',')} МБ)` : ''} — сабақта интернет болмаса да ашылады.`}</span>
        {st === 'loading' && <i className="offpack__bar"><b style={{ width: `${k * 100}%` }} /></i>}
      </div>
      {st !== 'loading' && (!ready || online) && (
        <button className={`btn${ready ? '' : ' primary'}`} type="button" disabled={!online} onClick={go}>{ready ? 'Жаңарту' : st === 'error' ? 'Қайталау' : st === 'update' ? 'Жаңарту' : 'Жүктеп алу'}</button>
      )}
    </div>
  );
}
