import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* Флешкаға жазылатын сабақтың ойнатқыштары (file:// арқылы ашылады, сондықтан ES-модуль емес — бір IIFE файл).
   vite build -c vite.portable.config.ts --mode board|lab → dist/usb/{board,lab}.js + .css
   Сайт оларды сабақ файлдарымен бірге флешкаға көшіреді (web/src/app/lib/usb.ts). */
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  publicDir: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: '../dist/usb',
    emptyOutDir: false,
    copyPublicDir: false,
    chunkSizeWarningLimit: 4000,
    lib: { entry: resolve(import.meta.dirname, `src/portable/${mode}.tsx`), formats: ['iife'], name: 'SBQ_' + mode, fileName: () => `${mode}.js`, cssFileName: mode },
  },
}));
