import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RegisterSWOptions } from 'virtual:pwa-register';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '@/lib/i18n';

const sw = vi.hoisted(() => ({
  options: [] as RegisterSWOptions[],
  updateSW: vi.fn<(reloadPage?: boolean) => Promise<void>>(() => Promise.resolve()),
}));

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: RegisterSWOptions = {}) => {
    sw.options.push(options);
    return sw.updateSW;
  },
}));

let online = true;

/** Fresh copies of the PWA store and both components (the store is module state). */
async function load() {
  vi.resetModules();
  const [{ OfflineIndicator }, { UpdatePrompt }, pwa] = await Promise.all([
    import('@/components/layout/OfflineIndicator'),
    import('@/components/layout/UpdatePrompt'),
    import('@/pwa'),
  ]);
  const options = sw.options.at(-1);
  if (!options) {
    throw new Error('registerSW was not called');
  }
  return { OfflineIndicator, UpdatePrompt, pwa, options };
}

function setOnline(value: boolean): void {
  online = value;
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
}

beforeEach(() => {
  online = true;
  sw.options.length = 0;
  sw.updateSW.mockClear();
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => online });
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(window.navigator, 'onLine');
});

describe('pwa registration', () => {
  it('registers the service worker once, with prompt callbacks', async () => {
    const { options } = await load();
    expect(sw.options).toHaveLength(1);
    expect(typeof options.onNeedRefresh).toBe('function');
    expect(typeof options.onOfflineReady).toBe('function');
    expect(sw.updateSW).not.toHaveBeenCalled();
  });
});

describe('OfflineIndicator', () => {
  it('is an empty polite live region while online and not yet ready', async () => {
    const { OfflineIndicator } = await load();
    render(<OfflineIndicator />);
    const region = screen.getByTestId('offline-indicator');
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toBeEmptyDOMElement();
  });

  it('reacts to offline and online events', async () => {
    const { OfflineIndicator } = await load();
    render(<OfflineIndicator />);
    const region = screen.getByTestId('offline-indicator');

    setOnline(false);
    expect(region).toHaveTextContent(t('offline.now'));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    setOnline(true);
    expect(region).toBeEmptyDOMElement();
  });

  it('starts in the offline state when the page loads without a connection', async () => {
    online = false;
    const { OfflineIndicator } = await load();
    render(<OfflineIndicator />);
    expect(screen.getByTestId('offline-indicator')).toHaveTextContent(t('offline.now'));
  });

  it('shows the ready message once and hides it after 6 seconds', async () => {
    const { OfflineIndicator, options, pwa } = await load();
    vi.useFakeTimers();
    render(<OfflineIndicator />);
    const region = screen.getByTestId('offline-indicator');

    act(() => options.onOfflineReady?.());
    expect(region).toHaveTextContent(t('offline.ready'));

    act(() => {
      vi.advanceTimersByTime(pwa.OFFLINE_READY_MS - 1);
    });
    expect(region).toHaveTextContent(t('offline.ready'));
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(region).toBeEmptyDOMElement();

    act(() => options.onOfflineReady?.());
    expect(region).toBeEmptyDOMElement();
  });

  it('closes the ready message with the close button', async () => {
    const { OfflineIndicator, options } = await load();
    render(<OfflineIndicator />);
    act(() => options.onOfflineReady?.());
    await userEvent.click(screen.getByRole('button', { name: t('common.close') }));
    expect(screen.getByTestId('offline-indicator')).toBeEmptyDOMElement();
  });

  it('shows the offline line instead of the ready message when both apply', async () => {
    const { OfflineIndicator, options } = await load();
    render(<OfflineIndicator />);
    act(() => options.onOfflineReady?.());
    setOnline(false);
    const region = screen.getByTestId('offline-indicator');
    expect(region).toHaveTextContent(t('offline.now'));
    expect(region).not.toHaveTextContent(t('offline.ready'));
  });
});

describe('UpdatePrompt', () => {
  it('renders nothing until a new version is waiting', async () => {
    const { UpdatePrompt } = await load();
    render(<UpdatePrompt />);
    expect(screen.queryByTestId('update-prompt')).not.toBeInTheDocument();
  });

  it('offers the update and calls the update function only on click', async () => {
    const { UpdatePrompt, options } = await load();
    render(<UpdatePrompt />);
    act(() => options.onNeedRefresh?.());

    const prompt = screen.getByTestId('update-prompt');
    expect(prompt).toHaveTextContent(t('update.available'));
    expect(screen.getByRole('status')).toHaveTextContent(t('update.available'));
    expect(sw.updateSW).not.toHaveBeenCalled();

    const reload = screen.getByRole('button', { name: t('update.reload') });
    await userEvent.click(reload);
    expect(sw.updateSW).toHaveBeenCalledTimes(1);
    expect(sw.updateSW).toHaveBeenCalledWith(true);
    expect(reload).toHaveAttribute('aria-busy', 'true');
  });

  it('can be dismissed without updating', async () => {
    const { UpdatePrompt, options } = await load();
    render(<UpdatePrompt />);
    act(() => options.onNeedRefresh?.());
    await userEvent.click(screen.getByRole('button', { name: t('common.close') }));
    expect(screen.queryByTestId('update-prompt')).not.toBeInTheDocument();
    expect(sw.updateSW).not.toHaveBeenCalled();
  });

  it('lets the visitor try again if the update fails', async () => {
    sw.updateSW.mockImplementationOnce(() => Promise.reject(new Error('no waiting worker')));
    const { UpdatePrompt, options } = await load();
    render(<UpdatePrompt />);
    act(() => options.onNeedRefresh?.());
    const reload = screen.getByRole('button', { name: t('update.reload') });
    await userEvent.click(reload);
    expect(sw.updateSW).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(reload).not.toHaveAttribute('aria-busy');
    });
  });
});
