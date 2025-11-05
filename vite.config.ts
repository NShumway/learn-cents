import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/ingest': '/src/ingest',
      '@/features': '/src/features',
      '@/personas': '/src/personas',
      '@/recommend': '/src/recommend',
      '@/guardrails': '/src/guardrails',
      '@/signals': '/src/signals',
      '@/types': '/src/types',
      '@/ui': '/ui',
      '@/eval': '/src/eval',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
