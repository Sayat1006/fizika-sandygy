import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

/** 3D зертхананы офлайн сақтау үшін: lab кіру нүктесінің барлық файлдары (жалқау жүктелетін бөліктерімен) → /lab-precache.json */
type Chunk = import('rollup').OutputChunk;
type Bundle = import('rollup').OutputBundle;
/** Бастапқы бөліктерден олардың барлық тәуелділіктерін (css, сурет) жинау. deep — жалқау импорттарды да қосу */
function closure(bundle: Bundle, starts: { file: string; deep: boolean }[]) {
  const byName = new Map((Object.values(bundle).filter((c) => c.type === 'chunk') as Chunk[]).map((c) => [c.fileName, c]));
  const files = new Set<string>(), q = [...starts];
  while (q.length) {
    const { file, deep } = q.pop()!; if (files.has(file)) continue; files.add(file);
    const c = byName.get(file); if (!c) continue;
    q.push(...c.imports.map((f) => ({ file: f, deep })), ...(deep ? c.dynamicImports.map((f) => ({ file: f, deep })) : []));
    const meta = (c as unknown as { viteMetadata?: { importedCss: Set<string>; importedAssets: Set<string> } }).viteMetadata;
    meta?.importedCss.forEach((x) => files.add(x)); meta?.importedAssets.forEach((x) => files.add(x));
  }
  return files;
}
const PUB = resolve(import.meta.dirname, '../public');
const fontUrls = () => [...readFileSync(PUB + '/assets/fonts.css', 'utf8').matchAll(/url\((\/assets\/fonts\/[^)]+)\)/g)].map((m) => m[1]);
function pack(bundle: Bundle, files: Set<string>, pub: string[]) {
  const list = [...pub, ...[...files].sort().map((f) => '/' + f)];
  const version = String(list.join('|').split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7));
  let bytes = 0;
  for (const f of files) { const o = bundle[f]; bytes += !o ? 0 : o.type === 'chunk' ? o.code.length : typeof o.source === 'string' ? o.source.length : o.source.byteLength; }
  for (const f of pub) { try { bytes += statSync(PUB + f).size; } catch { /* бет (/, /lab) */ } }
  return JSON.stringify({ version, bytes, files: list });
}

/* Интернетсіз ашу үшін алдын ала жүктелетін файлдар тізімі:
   /lab-precache.json — 3D зертхананың барлық файлы (жалқау бөліктерімен);
   /app-precache.json — негізгі сайттың қабығы, кабинет пен тақта (сабақты офлайнға сақтағанда). */
function precache(): Plugin {
  return {
    name: 'offline-precache',
    apply: 'build',
    generateBundle(_o, bundle) {
      const chunks = Object.values(bundle).filter((c) => c.type === 'chunk') as Chunk[];
      const fonts = fontUrls();
      const lab = chunks.find((c) => c.isEntry && c.name === 'lab');
      if (lab) this.emitFile({ type: 'asset', fileName: 'lab-precache.json', source: pack(bundle, closure(bundle, [{ file: lab.fileName, deep: true }]), ['/lab', '/assets/fonts.css', '/assets/lab-favicon.svg', ...fonts]) });
      const main = chunks.find((c) => c.isEntry && c.name === 'main');
      const page = (re: RegExp) => chunks.filter((c) => c.facadeModuleId && re.test(c.facadeModuleId)).map((c) => ({ file: c.fileName, deep: true }));
      if (main) this.emitFile({ type: 'asset', fileName: 'app-precache.json', source: pack(bundle,
        closure(bundle, [{ file: main.fileName, deep: false }, ...page(/pages[\\/](Board|cabinet[\\/]Cabinet)\.tsx$/)]),
        ['/', '/assets/fonts.css', '/assets/favicon.svg', '/manifest.webmanifest', ...fonts]) });
    },
  };
}

// «Сабақтас»: бір жоба, екі кіру нүктесі.
//   index.html      → негізгі сайт (/, /app, /board, /samples, /admin, /oferta, /privacy)
//   lab/index.html  → 3D зертхана (/lab/*)
// Репозиторий түбіріндегі public/ (слайд суреттері, lessons.json, үлгілер, қаріптер) жинаққа көшіріледі.
export default defineConfig({
  plugins: [react(), precache()],
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), lab: resolve(import.meta.dirname, 'lab/index.html') } },
  },
});
