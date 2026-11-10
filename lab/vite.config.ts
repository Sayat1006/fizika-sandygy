import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Зертхана «Сабақтас» сайтының /lab мекенжайында ашылады:
// жинақ статикалық сайттың public/lab бумасына шығады.
export default defineConfig({
  base: '/lab/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } }, // public/assets/morph.js ортақ файлын оқу үшін
  build: { outDir: '../public/lab', emptyOutDir: true, chunkSizeWarningLimit: 1200 },
});
