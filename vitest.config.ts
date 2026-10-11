import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Reuse the app's Vite config (aliases, React plugin) resolved in mode 'test'.
// vite.config.ts is owned by P0-01 and must not be edited — extend it here instead.
const baseConfig = viteConfig({ command: 'serve', mode: 'test' });

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'node',
      environmentMatchGlobs: [['tests/component/**', 'jsdom']],
      setupFiles: ['tests/setup.ts'],
      include: ['tests/{unit,component,integrity}/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        thresholds: {
          'src/lib/**': { lines: 100, branches: 100 },
          'src/components/**': { lines: 80 },
        },
      },
    },
  }),
);
