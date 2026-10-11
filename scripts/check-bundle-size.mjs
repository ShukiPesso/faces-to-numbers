// Bundle budget check (docs/02_ARCHITECTURE.md §9). Plain Node 20 ESM, no dependencies.
// Usage: node scripts/check-bundle-size.mjs [distDir]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const KB = 1024;

export const BUDGETS = {
  jsGzip: 200 * KB,
  cssGzip: 30 * KB,
  fontsRaw: 220 * KB,
  precacheTotal: 2 * 1024 * KB,
  fileCount: 300,
};

const ROWS = [
  { key: 'jsGzip', label: 'JS (all chunks, gzip)', unit: 'bytes' },
  { key: 'cssGzip', label: 'CSS (gzip)', unit: 'bytes' },
  { key: 'fontsRaw', label: 'Fonts (all woff2)', unit: 'bytes' },
  { key: 'precacheTotal', label: 'Total precache', unit: 'bytes' },
  { key: 'fileCount', label: 'Files in dist/', unit: 'files' },
];

/** Pure comparison: a value equal to its limit passes. */
export function evaluate(sizes, budgets = BUDGETS) {
  return ROWS.map(({ key, label, unit }) => {
    const actual = sizes[key];
    const limit = budgets[key];
    return { key, label, unit, actual, limit, ok: actual <= limit };
  });
}

function formatValue(value, unit) {
  return unit === 'files' ? String(value) : `${(value / KB).toFixed(1)} KB`;
}

export function formatTable(rows) {
  const header = ['Budget', 'Actual', 'Limit', 'Result'];
  const body = rows.map((r) => [
    r.label,
    formatValue(r.actual, r.unit),
    formatValue(r.limit, r.unit),
    r.ok ? 'OK' : 'FAIL',
  ]);
  const all = [header, ...body];
  const widths = header.map((_, i) => Math.max(...all.map((row) => row[i].length)));
  return all.map((row) => row.map((cell, i) => cell.padEnd(widths[i])).join('  ')).join('\n');
}

function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/** Files listed in dist/sw.js precache manifest (Workbox `url:"…"` entries). */
function precacheFiles(distDir) {
  const text = readFileSync(join(distDir, 'sw.js'), 'utf8');
  const urls = new Set();
  for (const match of text.matchAll(/\burl\s*:\s*["'`]([^"'`]+)["'`]/g)) {
    const url = match[1].split(/[?#]/)[0];
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) continue;
    const file = resolve(distDir, url.replace(/^\//, ''));
    if (file !== distDir && !file.startsWith(distDir + sep)) continue;
    if (existsSync(file) && statSync(file).isFile()) urls.add(file);
  }
  return [...urls];
}

export function measure(distDir) {
  const files = listFiles(distDir);
  let jsGzip = 0;
  let cssGzip = 0;
  let fontsRaw = 0;
  let total = 0;
  for (const file of files) {
    const size = statSync(file).size;
    total += size;
    if (file.endsWith('.js')) jsGzip += gzipSync(readFileSync(file)).length;
    else if (file.endsWith('.css')) cssGzip += gzipSync(readFileSync(file)).length;
    else if (file.endsWith('.woff2')) fontsRaw += size;
  }
  const hasSw = existsSync(join(distDir, 'sw.js'));
  const precacheTotal = hasSw
    ? precacheFiles(distDir).reduce((sum, f) => sum + statSync(f).size, 0)
    : total;
  return { jsGzip, cssGzip, fontsRaw, precacheTotal, fileCount: files.length, hasSw };
}

function main() {
  const distDir = resolve(process.argv[2] ?? 'dist');
  if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
    console.error(
      `${relative(process.cwd(), distDir) || distDir}/ does not exist. Run npm run build first.`,
    );
    return 1;
  }
  const sizes = measure(distDir);
  const rows = evaluate(sizes);
  process.stdout.write(`${formatTable(rows)}\n`);
  if (!sizes.hasSw)
    process.stdout.write('\nNote: dist/sw.js not found; precache total = total size of dist/.\n');
  const failed = rows.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`\nBundle budget exceeded: ${failed.map((r) => r.label).join(', ')}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
