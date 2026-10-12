import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// Hex values of --color-bg and --color-primary in design/tokens.json.
const COLOR_BG = '#FAF8F4';
const COLOR_PRIMARY = '#1F3864';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    // ADR-005: precache everything; a new version waits until the visitor taps "update".
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      // The icons are already matched by globPatterns; avoid listing them twice.
      includeManifestIcons: false,
      manifest: {
        name: 'פנים למספרים — סיור עצמאי בעוטף עזה',
        short_name: 'פנים למספרים',
        lang: 'he',
        dir: 'rtl',
        start_url: './#/',
        scope: './',
        display: 'standalone',
        background_color: COLOR_BG,
        theme_color: COLOR_PRIMARY,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 2500000,
        // A waiting worker never activates by itself; only the UpdatePrompt button sends
        // SKIP_WAITING. clientsClaim only lets the *first* worker control the page that installed
        // it (so the tour works offline without a reload); it never triggers a reload.
        skipWaiting: false,
        clientsClaim: true,
        // Same-origin precache only; no runtime caching of other origins.
        runtimeCaching: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@content-data': fromRoot(
        mode === 'e2e' ? './src/content/data.fixture.ts' : './src/content/data.real.ts',
      ),
      '@': fromRoot('./src'),
    },
  },
}));
