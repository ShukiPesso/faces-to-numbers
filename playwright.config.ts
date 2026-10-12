import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

const REAL_URL = 'http://localhost:4173';
const FIXTURE_URL = 'http://localhost:4174';

// Local-only escape hatch: when the Chromium build installed on a machine does not match the
// one @playwright/test expects, point PW_CHROMIUM_PATH at a Chromium binary. Unset in CI, where
// `npx playwright install --with-deps` provides the matching browsers.
const chromiumOverride = process.env.PW_CHROMIUM_PATH
  ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
  : {};

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  // In CI also emit GitHub annotations and a JSON report, so failures are readable from the
  // Actions API without downloading logs or artifacts (see .github/workflows/ci.yml).
  reporter: isCI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['github'],
        ['json', { outputFile: 'test-results/e2e-report.json' }],
      ]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
  },
  webServer: [
    {
      name: 'real',
      command: 'npm run build && npm run preview',
      url: REAL_URL,
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
    {
      name: 'fixture',
      command: 'npm run build:e2e && npm run preview:e2e',
      url: FIXTURE_URL,
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], ...chromiumOverride, baseURL: REAL_URL },
      grepInvert: /@fixture|@smoke/,
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'], baseURL: REAL_URL },
      grepInvert: /@fixture|@smoke|@sw/,
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Mini'], baseURL: REAL_URL },
      grepInvert: /@fixture|@smoke|@sw/,
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        ...chromiumOverride,
        viewport: { width: 1440, height: 900 },
        baseURL: REAL_URL,
      },
      grepInvert: /@fixture|@smoke/,
    },
    {
      name: 'fixture-chrome',
      use: { ...devices['Pixel 7'], ...chromiumOverride, baseURL: FIXTURE_URL },
      grep: /@fixture/,
    },
    {
      name: 'smoke',
      use: { ...devices['Pixel 7'], ...chromiumOverride, baseURL: process.env.LIVE_URL },
      grep: /@smoke/,
    },
  ],
});
