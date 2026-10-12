// Screenshots + horizontal-overflow check for the D-04 mockups (Chromium; WebKit is not available here).
// Run from the repo root:  node design/mockups/_build/shoot.mjs
// Env: CHROMIUM_PATH (default /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = readdirSync(dir)
  .filter((f) => f.endsWith('.html'))
  .sort();
const shots = [
  [390, 844],
  [820, 1180],
  [1440, 900],
];
const checks = [
  [320, 640],
  [360, 740],
  [390, 844],
  [820, 1180],
  [1024, 768],
  [1440, 900],
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
let failures = 0;
for (const file of pages) {
  const url = pathToFileURL(join(dir, file)).href;
  for (const [w, h] of checks) {
    const pg = await browser.newPage({ viewport: { width: w, height: h } });
    const requests = [];
    pg.on('request', (r) => {
      if (!r.url().startsWith('file:')) requests.push(r.url());
    });
    await pg.goto(url, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const { sw, cw } = await pg.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    const ok = sw <= cw && requests.length === 0;
    if (!ok) failures++;
    process.stdout.write(
      `${ok ? 'ok  ' : 'FAIL'} ${file} @${w}: scrollWidth ${sw} / clientWidth ${cw}; external requests ${requests.length}\n`,
    );
    if (shots.some(([sw2]) => sw2 === w)) {
      const name = file.replace('.html', '');
      // Grow the viewport to the full document height so the fixed bars render once, at the
      // bottom (where they sit after scrolling), instead of over the middle of the page.
      const fullH = await pg.evaluate(() => document.documentElement.scrollHeight);
      await pg.setViewportSize({ width: w, height: Math.max(h, fullH) });
      const fullH2 = await pg.evaluate(() => document.documentElement.scrollHeight);
      await pg.setViewportSize({ width: w, height: Math.max(h, fullH2) });
      await pg.screenshot({ path: join(dir, 'shots', `${name}-${w}.png`) });
    }
    await pg.close();
  }
}
await browser.close();
process.stdout.write(
  `${failures ? `${failures} failure(s)` : 'all pages: no horizontal scroll, no external requests'}\n`,
);
process.exit(failures ? 1 : 0);
