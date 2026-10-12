import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Component tests run in jsdom; mirror index.html (<html lang="he" dir="rtl">).
if (typeof document !== 'undefined') {
  document.documentElement.lang = 'he';
  document.documentElement.dir = 'rtl';
}

afterEach(() => {
  // Vitest globals are off, so RTL does not auto-cleanup; unmount rendered trees here for every test.
  if (typeof document !== 'undefined') {
    cleanup();
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
});
