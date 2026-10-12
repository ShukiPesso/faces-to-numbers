// Reads Playwright's JSON report and prints ONE GitHub error annotation listing every failed
// test (project › file:line › title › first error line). GitHub caps annotations per step at ~10,
// so a single combined annotation keeps the full list readable via the Actions API.
import { readFileSync, existsSync } from 'node:fs';

const file = process.argv[2] ?? 'test-results/e2e-report.json';
if (!existsSync(file)) {
  console.error(`::error title=E2E summary::No JSON report at ${file} (run may have crashed before tests).`);
  process.exit(0);
}
const report = JSON.parse(readFileSync(file, 'utf8'));
const failed = [];
const walk = (suite, titles) => {
  for (const s of suite.suites ?? []) walk(s, s.title ? [...titles, s.title] : titles);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      if (t.status !== 'unexpected') continue;
      const last = t.results?.[t.results.length - 1];
      const msg = (last?.error?.message ?? '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((l) => l.trim()) ?? '';
      failed.push(`[${t.projectName}] ${spec.file}:${spec.line} › ${[...titles, spec.title].join(' › ')} — ${msg.trim().slice(0, 200)}`);
    }
  }
};
for (const s of report.suites ?? []) walk(s, []);
const st = report.stats ?? {};
const head = `expected=${st.expected ?? '?'} unexpected=${st.unexpected ?? '?'} flaky=${st.flaky ?? '?'} skipped=${st.skipped ?? '?'}`;
const body = [head, ...failed.slice(0, 150)].join('\n');
const esc = (x) => x.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
console.error(`::error title=E2E failures (${failed.length})::${esc(body)}`);
console.error(body);
