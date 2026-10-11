import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// The PWA plugin is added by task F-18 — do not add it here.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@content-data': fromRoot(
        mode === 'e2e' ? './src/content/data.fixture.ts' : './src/content/data.real.ts',
      ),
      '@': fromRoot('./src'),
    },
  },
}));
