/**
 * T-12 / T-11 HIGH-3 — the OfflineIndicator panel is out of the page flow (fixed position), so
 * showing "saved on the device" or "no connection" never moves content (F-19/F-20, CLS).
 */
import { act, render, screen } from '@testing-library/react';
import type { RegisterSWOptions } from 'virtual:pwa-register';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sw = vi.hoisted(() => ({ options: [] as RegisterSWOptions[] }));

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: RegisterSWOptions = {}) => {
    sw.options.push(options);
    return () => Promise.resolve();
  },
}));

let online = true;

async function load() {
  vi.resetModules();
  const { OfflineIndicator } = await import('@/components/layout/OfflineIndicator');
  await import('@/pwa');
  const options = sw.options.at(-1);
  if (!options?.onOfflineReady) {
    throw new Error('registerSW was not called with onOfflineReady');
  }
  return { OfflineIndicator, onOfflineReady: options.onOfflineReady };
}

beforeEach(() => {
  online = true;
  sw.options.length = 0;
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => online });
});

afterEach(() => {
  Reflect.deleteProperty(window.navigator, 'onLine');
});

function expectOutOfFlow(region: HTMLElement): void {
  const classes = region.className.split(/\s+/);
  expect(classes, 'panel wrapper must be position: fixed').toContain('fixed');
  expect(classes, 'panel wrapper must not be in the flow').not.toContain('static');
  expect(classes).not.toContain('relative');
}

describe('OfflineIndicator stays out of the page flow', () => {
  it('the "saved on the device" panel is fixed-position', async () => {
    const { OfflineIndicator, onOfflineReady } = await load();
    render(<OfflineIndicator />);
    const region = screen.getByTestId('offline-indicator');
    expect(region).toBeEmptyDOMElement();

    act(() => {
      onOfflineReady();
    });
    expect(region).not.toBeEmptyDOMElement();
    expectOutOfFlow(region);
  });

  it('the "no connection" panel is fixed-position', async () => {
    const { OfflineIndicator } = await load();
    render(<OfflineIndicator />);
    const region = screen.getByTestId('offline-indicator');

    online = false;
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(region).not.toBeEmptyDOMElement();
    expectOutOfFlow(region);
  });
});
