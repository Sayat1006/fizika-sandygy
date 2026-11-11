import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// Пішіндер мен морф шейдері «Сабақтас» басты бетімен ортақ — бір файлдан алынады.
import '../../shared/morph.js';

interface Morph {
  mount: (canvas: HTMLCanvasElement, opts: Record<string, unknown>) => { dispose: () => void } | null;
}

/** Басты беттегі 3D бөлшектер морфы: атом → толқын → серіппе → магнит өрісі → ғаламшар (иллюстрация). */
export default function MorphHero() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const api = (window as unknown as { FSMorph?: Morph }).FSMorph;
    if (!ref.current || !api) return;
    const m = api.mount(ref.current, { THREE, inkVar: '--faint' });
    return () => m?.dispose();
  }, []);
  return <canvas ref={ref} className="morph-canvas" aria-hidden />;
}
