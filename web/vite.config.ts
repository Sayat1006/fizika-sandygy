import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// «Сабақтас»: бір жоба, екі кіру нүктесі.
//   index.html      → негізгі сайт (/, /app, /board, /samples, /admin, /oferta, /privacy)
//   lab/index.html  → 3D зертхана (/lab/*)
// Репозиторий түбіріндегі public/ (слайд суреттері, lessons.json, үлгілер, қаріптер) жинаққа көшіріледі.
export default defineConfig({
  plugins: [react()],
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), lab: resolve(import.meta.dirname, 'lab/index.html') } },
  },
});
