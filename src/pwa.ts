/// <reference types="vite-plugin-pwa/client" />
import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * Service-worker state for OfflineIndicator and UpdatePrompt (ADR-005).
 * The worker is registered once, when this module is first imported. Nothing here ever reloads
 * the page: a new version only takes over after the visitor taps the UpdatePrompt button.
 */
export interface PwaState {
  /** A new version is installed and waiting for the visitor to choose to update. */
  needRefresh: boolean;
  /** The precache has just completed for the first time (shown once, then hidden). */
  offlineReady: boolean;
}

/** How long the one-time "saved on the device" message stays before hiding itself. */
export const OFFLINE_READY_MS = 6000;

let state: PwaState = { needRefresh: false, offlineReady: false };
const listeners = new Set<() => void>();
let readyShown = false;
let readyTimer: ReturnType<typeof setTimeout> | undefined;

function setState(patch: Partial<PwaState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): PwaState {
  return state;
}

const updateSW = registerSW({
  onNeedRefresh() {
    setState({ needRefresh: true });
  },
  onOfflineReady() {
    if (readyShown) {
      return;
    }
    readyShown = true;
    setState({ offlineReady: true });
    readyTimer = setTimeout(() => {
      readyTimer = undefined;
      setState({ offlineReady: false });
    }, OFFLINE_READY_MS);
  },
});

/** Subscribes a component to the service-worker state. */
export function usePwaState(): PwaState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Hides the "saved on the device" message (close button). */
export function dismissOfflineReady(): void {
  if (readyTimer !== undefined) {
    clearTimeout(readyTimer);
    readyTimer = undefined;
  }
  setState({ offlineReady: false });
}

/** Hides the update prompt until the next app start; the new version keeps waiting. */
export function dismissUpdate(): void {
  setState({ needRefresh: false });
}

/**
 * Activates the waiting version. Called only from the UpdatePrompt button; the page reloads once
 * the new worker takes control, as a direct result of that tap.
 */
export function updateServiceWorker(): Promise<void> {
  return updateSW(true);
}
