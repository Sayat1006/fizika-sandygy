/** Құрылғыда WebGL бар-жоғын тексереді (жоқ болса 2D жеңілдетілген режим қосылады). */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
