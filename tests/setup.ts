import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Component tests run in jsdom; mirror index.html (<html lang="he" dir="rtl">).
if (typeof document !== 'undefined') {
  document.documentElement.lang = 'he';
  document.documentElement.dir = 'rtl';
}

afterEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
});
