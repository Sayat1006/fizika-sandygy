/* Сабақтың сөзсіз 3D видеолары: public/videos.json ({"v:n": [{src, poster, title}]}, tools/video/publish.py жасайды) */
export interface Video { src: string; poster: string | null; title: string }

let cache: Promise<Record<string, Video[]>> | null = null;
export function loadVideos() {
  if (!cache) cache = fetch('/videos.json').then((r) => (r.ok ? r.json() : {})).catch(() => { cache = null; return {}; });
  return cache;
}

/** сабақтың видеолары (7–9-сыныпта нұсқа атауы сынып нөмірімен бірдей) */
export async function videosOf(v: string, n: number, grade: number): Promise<Video[]> {
  const all = await loadVideos();
  return all[`${v}:${n}`] || (grade < 10 ? all[`${grade}:${n}`] : null) || [];
}
