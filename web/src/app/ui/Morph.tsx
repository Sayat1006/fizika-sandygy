/* Басты беттегі 3D бөлшектер морфы: атом → толқын → серіппе → магнит өрісі → ғаламшар.
   Пішіндер мен шейдер src/shared/morph.js ішінде (зертханамен ортақ). */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import '../../shared/morph.js';

interface MorphApi { mount: (c: HTMLCanvasElement, o: Record<string, unknown>) => { dispose: () => void } | null }

export default function Morph({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const api = (window as unknown as { FSMorph?: MorphApi }).FSMorph;
    if (!ref.current || !api) return;
    const m = api.mount(ref.current, { THREE, hold: 4.2, morph: 2.2, size: 3.4 });
    return () => m?.dispose();
  }, []);
  return <canvas ref={ref} className={className} aria-hidden />;
}
