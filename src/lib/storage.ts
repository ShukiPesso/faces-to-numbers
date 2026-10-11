import type { Depth } from '@/content/schema';

const VISITED_KEY = 'ftn:v1:visited';
const DEPTH_KEY = 'ftn:v1:depth';
const READ_ALOUD_KEY = 'ftn:v1:readAloud';
const GATES_KEY = 'ftn:v1:gates';

const DEFAULT_DEPTH: Depth = 'm2';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isDepth(value: unknown): value is Depth {
  return value === 's30' || value === 'm2' || value === 'm5';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/** Reads and validates a JSON value; on missing/corrupt/invalid data returns and stores the default. */
function read<T>(
  store: () => Storage,
  key: string,
  isValid: (value: unknown) => value is T,
  fallback: T,
): T {
  return safe(() => {
    const raw = store().getItem(key);
    if (raw !== null) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) return parsed;
      } catch {
        // corrupt JSON: fall through to overwrite with the default
      }
    }
    store().setItem(key, JSON.stringify(fallback));
    return fallback;
  }, fallback);
}

function write(store: () => Storage, key: string, value: unknown): void {
  safe(() => {
    store().setItem(key, JSON.stringify(value));
  }, undefined);
}

const local = (): Storage => localStorage;
const session = (): Storage => sessionStorage;

export function getVisited(): string[] {
  return read(local, VISITED_KEY, isStringArray, []);
}

export function markVisited(id: string): void {
  const visited = getVisited();
  if (!visited.includes(id)) write(local, VISITED_KEY, [...visited, id]);
}

export function unmarkVisited(id: string): void {
  write(
    local,
    VISITED_KEY,
    getVisited().filter((v) => v !== id),
  );
}

export function resetProgress(): void {
  write(local, VISITED_KEY, []);
}

export function getDepth(): Depth {
  return read(local, DEPTH_KEY, isDepth, DEFAULT_DEPTH);
}

export function setDepth(depth: Depth): void {
  write(local, DEPTH_KEY, depth);
}

export function getReadAloud(): boolean {
  return read(local, READ_ALOUD_KEY, isBoolean, false);
}

export function setReadAloud(value: boolean): void {
  write(local, READ_ALOUD_KEY, value);
}

export function isGateOpened(personId: string): boolean {
  return read(session, GATES_KEY, isStringArray, []).includes(personId);
}

export function openGate(personId: string): void {
  const gates = read(session, GATES_KEY, isStringArray, []);
  if (!gates.includes(personId)) write(session, GATES_KEY, [...gates, personId]);
}
