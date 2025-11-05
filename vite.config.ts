import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@/ingest': '/src/ingest',
      '@/features': '/src/features',
      '@/personas': '/src/personas',
      '@/recommend': '/src/recommend',
      '@/guardrails': '/src/guardrails',
      '@/ui': '/ui',
      '@/eval': '/src/eval',
      '@/types': '/src/types',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
