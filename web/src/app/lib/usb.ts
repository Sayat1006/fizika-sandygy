/* Сабақты флешкаға жазу: мектептегі тақтада интернет жоқ болса да, кабинетке кірусіз ашылады.
   Флешкадағы папка:
     «Сабақты ашу.html»          — екі рет басқанда браузерде тақта ашылады
     files/board.js, board.css    — тақта ойнатқышы (vite.portable.config.ts → /usb/*)
     files/lab.html, lab.js/.css  — 3D тәжірибе (болса)
     files/data.js                — сабақтың деректері (презентация, сценарий, бет суреттері, видеолар тізімі)
     files/p/*, files/v/*         — слайд/парақ суреттері мен видеолар
     files/fonts.css, files/fonts — қаріптер
   Chrome/Edge-те папка тікелей флешкаға жазылады (File System Access API), басқа браузерде — ZIP. */
import { labOf } from './config';
import { lessonDeck, lessonPlan, viewPages, type Lesson } from './data';
import { videosOf } from './videos';

type Src = string | Blob;
interface Entry { path: string; src: Src }
const enc = (s: string) => new Blob([s], { type: 'text/plain;charset=utf-8' });
const ext = (u: string, d: string) => (/\.([a-z0-9]{2,5})(?:$|\?)/i.exec(u)?.[1] || d).toLowerCase();
const two = (n: number) => String(n).padStart(2, '0');
/** Windows папка атауына жарамды */
export const folderName = (l: Lesson) => `${l.grade}-сынып №${l.disp} ${l.topic}`.replace(/[\\/:*?"<>|«»]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90).trim();
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

const page = (title: string, css: string[], js: string[]) => `<!doctype html>
<html lang="kk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
${css.map((c) => `<link rel="stylesheet" href="${c}">`).join('\n')}
</head><body><div id="root"></div>
${js.map((j) => `<script src="${j}"></script>`).join('\n')}
</body></html>
`;

/** Флешкаға жазылатын файлдар тізімі. Сәтсіз болса — қате мәтіні */
async function collect(l: Lesson): Promise<{ entries: Entry[] } | { error: string }> {
  const [plan, deck, pres, ws, vids] = await Promise.all([
    lessonPlan(l.v, l.n), lessonDeck(l.v, l.n),
    l.pres ? viewPages(l.v, l.n, 'pres').catch(() => null) : null,
    l.ws ? viewPages(l.v, l.n, 'ws').catch(() => null) : null,
    videosOf(l.v, l.n, l.grade).catch(() => []),
  ]);
  if (plan.status === 402) return { error: 'Бұл сабақ жазылыммен ашылады.' };
  if (plan.status === 401) return { error: 'Сессия аяқталды. Кабинетке қайта кіріңіз.' };
  if (plan.status >= 400) return { error: 'Материалдарды алу мүмкін болмады. Қайталап көріңіз.' };
  const e: Entry[] = [];
  const add = (path: string, src: Src) => { e.push({ path, src }); return path; };
  const dk = deck?.slides?.length ? deck : null; // анимациялы презентация болса, слайд суреттері керек емес
  const presP = dk ? [] : (pres?.pages || []).map((u, i) => add(`files/p/slide-${two(i + 1)}.${ext(u, 'webp')}`, u));
  const wsP = (ws?.pages || []).map((u, i) => add(`files/p/parak-${two(i + 1)}.${ext(u, 'webp')}`, u));
  const videos = vids.map((v, i) => ({
    title: v.title,
    src: add(`files/v/video-${i + 1}.mp4`, v.src),
    poster: v.poster ? add(`files/v/video-${i + 1}.${ext(v.poster, 'jpg')}`, v.poster) : null,
  }));
  const exp = labOf(l)?.exp || null;
  const data = {
    lesson: { grade: l.grade, disp: l.disp, topic: l.topic },
    pages: { pres: dk ? dk.slides.map((_, k) => `deck:${k}`) : presP, ws: wsP },
    deck: dk, stages: plan.stages || [], videos,
    lab: exp ? `files/lab.html?embed=1#/experiments/${exp}` : null,
  };
  add('files/data.js', enc(`window.SBQ = ${JSON.stringify(data)};\n`));
  // қаріптер: салыстырмалы жолмен
  const fontsCss = await (await fetch('/assets/fonts.css')).text();
  const fonts = [...new Set([...fontsCss.matchAll(/url\((\/assets\/fonts\/[^)]+)\)/g)].map((m) => m[1]))];
  fonts.forEach((f) => add('files/fonts/' + f.split('/').pop(), f));
  add('files/fonts.css', enc(fontsCss.replace(/url\(\/assets\/fonts\//g, 'url(fonts/')));
  add('files/board.js', '/usb/board.js'); add('files/board.css', '/usb/board.css');
  add('Сабақты ашу.html', enc(page(`${l.topic} · Сабақтас`, ['files/fonts.css', 'files/board.css'], ['files/data.js', 'files/board.js'])));
  if (exp) {
    add('files/lab.js', '/usb/lab.js'); add('files/lab.css', '/usb/lab.css');
    add('files/lab.html', enc(page('3D тәжірибе · Сабақтас', ['fonts.css', 'lab.css'], ['lab.js'])));
  }
  add('Нұсқаулық.txt', enc([
    `«Сабақтас» — ${l.grade}-сынып, №${l.disp}: ${l.topic}`, '',
    'Тақтада ашу:', '1. Флешканы тақтаға (компьютерге) қосыңыз.', '2. Осы папкадағы «Сабақты ашу.html» файлын екі рет басыңыз (Chrome, Edge немесе Яндекс браузер).',
    '3. Интернет те, кабинетке кіру де керек емес.', '', 'Басқару: → / PageDown — келесі, ← / PageUp — алдыңғы, F — толық экран, B — экранды қарайту.',
    '«files» папкасын өшірмеңіз және жылжытпаңыз — сабақтың файлдары сонда.', '',
  ].join('\r\n')));
  return { entries: e };
}

async function blobOf(src: Src) {
  if (typeof src !== 'string') return src;
  const r = await fetch(src);
  if (!r.ok) throw new Error(`${src}: ${r.status}`);
  return r.blob();
}

type FsDir = { getDirectoryHandle: (n: string, o?: { create?: boolean }) => Promise<FsDir>; getFileHandle: (n: string, o?: { create?: boolean }) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>; name: string };
type Picker = (o?: { mode?: string; id?: string; startIn?: string }) => Promise<FsDir>;
export const canPickFolder = () => typeof (window as unknown as { showDirectoryPicker?: Picker }).showDirectoryPicker === 'function' && window.self === window.top;

export type UsbResult = { ok: true; where: string; zip: boolean } | { ok: false; error: string; cancelled?: boolean };

/** Флешкаға жазу. onProgress(0..1) */
export async function saveToUsb(l: Lesson, onProgress?: (k: number) => void): Promise<UsbResult> {
  if (!navigator.onLine) return { ok: false, error: 'Интернет жоқ. Сабақты флешкаға интернет бар кезде жазыңыз.' };
  // папканы таңдау терезесі пайдаланушы басқан сәтте ашылуы керек — сондықтан бірінші
  let dir: FsDir | null = null;
  if (canPickFolder()) {
    try { dir = await (window as unknown as { showDirectoryPicker: Picker }).showDirectoryPicker({ mode: 'readwrite', id: 'sbq-usb' }); }
    catch (e) { if ((e as Error).name === 'AbortError') return { ok: false, error: '', cancelled: true }; dir = null; }
  }
  onProgress?.(0.02);
  const c = await collect(l);
  if ('error' in c) return { ok: false, error: c.error };
  const name = folderName(l), list = c.entries;
  let done = 0; const tick = () => onProgress?.(0.04 + 0.96 * (++done / list.length));
  try {
    if (dir) {
      const root = await dir.getDirectoryHandle(name, { create: true });
      const dirs = new Map<string, FsDir>([['', root]]);
      const sub = async (p: string): Promise<FsDir> => {
        if (dirs.has(p)) return dirs.get(p)!;
        const i = p.lastIndexOf('/'), parent = await sub(i < 0 ? '' : p.slice(0, i));
        const d = await parent.getDirectoryHandle(p.slice(i + 1), { create: true }); dirs.set(p, d); return d;
      };
      const one = async (x: Entry) => {
        const i = x.path.lastIndexOf('/'), d = await sub(i < 0 ? '' : x.path.slice(0, i));
        const b = await blobOf(x.src);
        const w = await (await d.getFileHandle(x.path.slice(i + 1), { create: true })).createWritable();
        await w.write(b); await w.close(); tick();
      };
      for (let i = 0; i < list.length; i += 4) await Promise.all(list.slice(i, i + 4).map(one));
      return { ok: true, where: `${dir.name}/${name}`, zip: false };
    }
    // ZIP: бүкіл папка бір файлда (флешкада ашып, «Барлығын шығару»)
    const { zip } = await import('fflate');
    const files: Record<string, Uint8Array> = {};
    const one = async (x: Entry) => { files[`${name}/${x.path}`] = new Uint8Array(await (await blobOf(x.src)).arrayBuffer()); tick(); };
    for (let i = 0; i < list.length; i += 4) await Promise.all(list.slice(i, i + 4).map(one));
    const out = await new Promise<Uint8Array>((res, rej) => zip(files, { level: 0 }, (err, d) => (err ? rej(err) : res(d))));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([out as BlobPart], { type: 'application/zip' })); a.download = name + '.zip';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    return { ok: true, where: name + '.zip', zip: true };
  } catch {
    return { ok: false, error: 'Жазу аяқталмады. Флешкада орын бар ма және ол қосулы ма — тексеріп, қайталаңыз.' };
  }
}
