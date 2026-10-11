/**
 * CI-03 — No drift: a fresh build of content-source/ must equal the committed JSON.
 *
 * This test only *runs* `npm run content:check` as a child process and inspects its exit code.
 * It deliberately imports nothing from the converter (T-01, ADR-003).
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const COMMAND_TIMEOUT_MS = 60_000;

interface CommandResult {
  exitCode: number;
  output: string;
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Buffer) return value.toString('utf8');
  return '';
}

/** Runs a shell command in the repo root and never throws: failures become a non-zero exit code. */
function runCommand(command: string): CommandResult {
  try {
    const stdout = execSync(command, {
      cwd: REPO_ROOT,
      timeout: COMMAND_TIMEOUT_MS,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { exitCode: 0, output: stdout };
  } catch (error: unknown) {
    const e = (typeof error === 'object' && error !== null ? error : {}) as Record<string, unknown>;
    const status = typeof e.status === 'number' ? e.status : 1;
    const message = typeof e.message === 'string' ? e.message : String(error);
    const output = [
      `command: ${command}`,
      `exit code: ${String(status)}`,
      `--- stdout ---\n${asText(e.stdout)}`,
      `--- stderr ---\n${asText(e.stderr)}`,
      `--- error ---\n${message}`,
    ].join('\n');
    return { exitCode: status === 0 ? 1 : status, output };
  }
}

describe('CI-03 no drift between content-source/ and src/content/data/', () => {
  it(
    'CI-03 npm run content:check exits 0',
    () => {
      const result = runCommand('npm run content:check');
      expect(result.exitCode, `content:check reported drift or failed:\n${result.output}`).toBe(0);
    },
    COMMAND_TIMEOUT_MS + 30_000,
  );

  it('CI-03 self-check: a failing command is reported as failure with its output', () => {
    // In-memory negative case: a command that writes to stderr and exits 3 (nothing on disk).
    const result = runCommand(
      `node -e "process.stderr.write('simulated drift in test-file.json'); process.exit(3)"`,
    );
    expect(result.exitCode).toBe(3);
    expect(result.output).toContain('simulated drift in test-file.json');
  });
});
