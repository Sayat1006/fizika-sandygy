import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

/** 3D зертхананы офлайн сақтау үшін: lab кіру нүктесінің барлық файлдары (жалқау жүктелетін бөліктерімен) → /lab-precache.json */
function labPrecache(): Plugin {
  return {
    name: 'lab-precache',
    apply: 'build',
    generateBundle(_o, bundle) {
      const chunks = Object.values(bundle).filter((c) => c.type === 'chunk') as import('rollup').OutputChunk[];
      const byName = new Map(chunks.map((c) => [c.fileName, c]));
      const entry = chunks.find((c) => c.isEntry && c.name === 'lab');
      if (!entry) return;
      const files = new Set<string>(), q = [entry.fileName];
      while (q.length) {
        const f = q.pop()!; if (files.has(f)) continue; files.add(f);
        const c = byName.get(f); if (!c) continue;
        q.push(...c.imports, ...c.dynamicImports);
        const meta = (c as unknown as { viteMetadata?: { importedCss: Set<string>; importedAssets: Set<string> } }).viteMetadata;
        meta?.importedCss.forEach((x) => files.add(x)); meta?.importedAssets.forEach((x) => files.add(x));
      }
      const fonts = [...readFileSync(resolve(import.meta.dirname, '../public/assets/fonts.css'), 'utf8').matchAll(/url\((\/assets\/fonts\/[^)]+)\)/g)].map((m) => m[1]);
      const list = ['/lab', '/assets/fonts.css', '/assets/lab-favicon.svg', ...fonts, ...[...files].sort().map((f) => '/' + f)];
      const version = String(list.join('|').split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7));
      let bytes = 0;
      for (const f of files) { const o = bundle[f]; bytes += !o ? 0 : o.type === 'chunk' ? o.code.length : typeof o.source === 'string' ? o.source.length : o.source.byteLength; }
      for (const f of fonts) bytes += statSync(resolve(import.meta.dirname, '../public' + f)).size;
      this.emitFile({ type: 'asset', fileName: 'lab-precache.json', source: JSON.stringify({ version, bytes, files: list }) });
    },
  };
}

// «Сабақтас»: бір жоба, екі кіру нүктесі.
//   index.html      → негізгі сайт (/, /app, /board, /samples, /admin, /oferta, /privacy)
//   lab/index.html  → 3D зертхана (/lab/*)
// Репозиторий түбіріндегі public/ (слайд суреттері, lessons.json, үлгілер, қаріптер) жинаққа көшіріледі.
export default defineConfig({
  plugins: [react(), labPrecache()],
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), lab: resolve(import.meta.dirname, 'lab/index.html') } },
  },
});
