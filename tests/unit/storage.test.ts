// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getDepth,
  getReadAloud,
  getVisited,
  isGateOpened,
  markVisited,
  openGate,
  resetProgress,
  setDepth,
  setReadAloud,
  unmarkVisited,
} from '@/lib/storage';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('visited (UT-STO-01)', () => {
  it('defaults to empty', () => {
    expect(getVisited()).toEqual([]);
  });
  it('adds, dedupes, removes and resets', () => {
    markVisited('a');
    markVisited('b');
    markVisited('a');
    expect(getVisited()).toEqual(['a', 'b']);
    unmarkVisited('a');
    expect(getVisited()).toEqual(['b']);
    resetProgress();
    expect(getVisited()).toEqual([]);
  });
  it('persists in localStorage under the versioned key', () => {
    markVisited('a');
    expect(localStorage.getItem('ftn:v1:visited')).toBe('["a"]');
    expect(getVisited()).toEqual(['a']);
  });
});

describe('depth (UT-STO-02)', () => {
  it('defaults to m2', () => {
    expect(getDepth()).toBe('m2');
  });
  it('sets and gets', () => {
    setDepth('s30');
    expect(getDepth()).toBe('s30');
    setDepth('m5');
    expect(getDepth()).toBe('m5');
  });
  it('invalid stored value returns default and overwrites', () => {
    localStorage.setItem('ftn:v1:depth', '"xx"');
    expect(getDepth()).toBe('m2');
    expect(localStorage.getItem('ftn:v1:depth')).toBe('"m2"');
  });
});

describe('readAloud (UT-STO-03)', () => {
  it('defaults to false', () => {
    expect(getReadAloud()).toBe(false);
  });
  it('sets and gets', () => {
    setReadAloud(true);
    expect(getReadAloud()).toBe(true);
    setReadAloud(false);
    expect(getReadAloud()).toBe(false);
  });
});

describe('gates (UT-STO-04)', () => {
  it('uses sessionStorage only, per person', () => {
    expect(isGateOpened('p1')).toBe(false);
    openGate('p1');
    openGate('p1');
    expect(isGateOpened('p1')).toBe(true);
    expect(isGateOpened('p2')).toBe(false);
    expect(sessionStorage.getItem('ftn:v1:gates')).toBe('["p1"]');
    expect(localStorage.getItem('ftn:v1:gates')).toBeNull();
  });
});

describe('storage failures (UT-STO-05)', () => {
  it('never throws and returns defaults when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(getVisited()).toEqual([]);
    expect(() => markVisited('a')).not.toThrow();
    expect(() => unmarkVisited('a')).not.toThrow();
    expect(() => resetProgress()).not.toThrow();
    expect(getDepth()).toBe('m2');
    expect(() => setDepth('m5')).not.toThrow();
    expect(getReadAloud()).toBe(false);
    expect(() => setReadAloud(true)).not.toThrow();
    expect(isGateOpened('p1')).toBe(false);
    expect(() => openGate('p1')).not.toThrow();
  });
  it('setItem failing alone does not throw on reads', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(getDepth()).toBe('m2');
  });
});

describe('corrupt data (UT-STO-06)', () => {
  it('corrupt JSON returns default and overwrites the key', () => {
    localStorage.setItem('ftn:v1:visited', '{not json');
    expect(getVisited()).toEqual([]);
    expect(localStorage.getItem('ftn:v1:visited')).toBe('[]');
  });
  it('wrong shape returns default and overwrites', () => {
    localStorage.setItem('ftn:v1:visited', '[1,2]');
    expect(getVisited()).toEqual([]);
    expect(localStorage.getItem('ftn:v1:visited')).toBe('[]');
    localStorage.setItem('ftn:v1:visited', '"a"');
    expect(getVisited()).toEqual([]);
    localStorage.setItem('ftn:v1:readAloud', '"yes"');
    expect(getReadAloud()).toBe(false);
    expect(localStorage.getItem('ftn:v1:readAloud')).toBe('false');
    sessionStorage.setItem('ftn:v1:gates', 'oops');
    expect(isGateOpened('p1')).toBe(false);
    expect(sessionStorage.getItem('ftn:v1:gates')).toBe('[]');
  });
});
