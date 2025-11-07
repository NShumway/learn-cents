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
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
