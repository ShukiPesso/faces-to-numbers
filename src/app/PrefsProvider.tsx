import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Depth } from '@/content/schema';
import * as storage from '@/lib/storage';
import { PrefsContext, type Prefs } from './prefsContext';

export interface PrefsProviderProps {
  children: ReactNode;
}

/**
 * Holds the reading depth and read-aloud preferences, backed by `src/lib/storage.ts`.
 * While read-aloud is on, `<html data-read-aloud="true">` is set (tokens.css enlarges text).
 */
export function PrefsProvider({ children }: PrefsProviderProps) {
  const [depth, setDepthState] = useState<Depth>(() => storage.getDepth());
  const [readAloud, setReadAloudState] = useState<boolean>(() => storage.getReadAloud());

  const setDepth = useCallback((next: Depth) => {
    storage.setDepth(next);
    setDepthState(next);
  }, []);

  const setReadAloud = useCallback((next: boolean) => {
    storage.setReadAloud(next);
    setReadAloudState(next);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (readAloud) {
      root.dataset.readAloud = 'true';
    } else {
      delete root.dataset.readAloud;
    }
  }, [readAloud]);

  const value = useMemo<Prefs>(
    () => ({ depth, setDepth, readAloud, setReadAloud }),
    [depth, setDepth, readAloud, setReadAloud],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}
