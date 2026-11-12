import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// tools/deck/art_png.py үшін бөлек жинақ (сайтқа кірмейді)
export default defineConfig({ root: import.meta.dirname, base: './', plugins: [react()], publicDir: false, build: { outDir: process.env.ART_OUT || '/tmp/art-build', emptyOutDir: true } });
