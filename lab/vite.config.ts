import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Зертхана «Сабақтас» сайтының /lab мекенжайында ашылады:
// жинақ статикалық сайттың public/lab бумасына шығады.
export default defineConfig({
  base: '/lab/',
  plugins: [react()],
  build: { outDir: '../public/lab', emptyOutDir: true, chunkSizeWarningLimit: 1200 },
});
