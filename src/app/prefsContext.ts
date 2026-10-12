import { createContext, useContext } from 'react';
import type { Depth } from '@/content/schema';

export interface Prefs {
  depth: Depth;
  setDepth: (depth: Depth) => void;
  readAloud: boolean;
  setReadAloud: (value: boolean) => void;
}

export const PrefsContext = createContext<Prefs | null>(null);

/** Reading preferences (depth, read-aloud). Must be used inside `PrefsProvider`. */
export function usePrefs(): Prefs {
  const prefs = useContext(PrefsContext);
  if (prefs === null) {
    throw new Error('usePrefs must be used inside <PrefsProvider>');
  }
  return prefs;
}
