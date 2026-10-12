import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SilenceMoment } from '@/components/reading/SilenceMoment';
import { t } from '@/lib/i18n';

const PROMPT = 'טקסט בדיקה לרגע של שקט';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CT-SILENCE-01 SilenceMoment', () => {
  it('idle shows title, prompt and a start button with the seconds; never auto-starts', () => {
    render(<SilenceMoment seconds={60} prompt={PROMPT} />);
    expect(screen.getByRole('heading', { name: t('silence.title') })).toBeInTheDocument();
    expect(screen.getByText(PROMPT)).toBeInTheDocument();
    expect(screen.getByTestId('silence-start')).toHaveTextContent(
      t('silence.start', { seconds: 60 }),
    );
    expect(screen.queryByTestId('silence-timer')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(screen.queryByText(t('silence.ended'))).toBeNull();
    expect(screen.getByTestId('silence-start')).toBeInTheDocument();
  });

  it('running is static: no digits, identical text at 1s and seconds-1, no audio or vibration', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, vibrate });
    const { container } = render(<SilenceMoment seconds={60} prompt={PROMPT} />);
    fireEvent.click(screen.getByTestId('silence-start'));

    const panel = screen.getByTestId('silence-timer');
    expect(panel).toHaveTextContent(PROMPT);
    expect(panel).toHaveTextContent(t('silence.stop'));
    expect(screen.queryByTestId('silence-start')).toBeNull();
    expect(panel.textContent).not.toMatch(/\d/);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const early = panel.textContent;
    act(() => {
      vi.advanceTimersByTime(58_000);
    });
    expect(screen.getByTestId('silence-timer').textContent).toBe(early);
    expect(screen.getByTestId('silence-timer').textContent).not.toMatch(/\d/);
    expect(container.querySelector('audio')).toBeNull();
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('shows the quiet ended message after the seconds elapse', () => {
    render(<SilenceMoment seconds={60} prompt={PROMPT} />);
    fireEvent.click(screen.getByTestId('silence-start'));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getAllByText(t('silence.ended')).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('silence-timer')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(PROMPT)).toBeNull();
  });

  it('stop ends it immediately and clears the pending timeout', () => {
    const setSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    render(<SilenceMoment seconds={60} prompt={PROMPT} />);
    fireEvent.click(screen.getByTestId('silence-start'));
    const idx = setSpy.mock.calls.findIndex((call) => call[1] === 60_000);
    expect(idx).toBeGreaterThanOrEqual(0);
    const timerId = setSpy.mock.results[idx]?.value as unknown;
    fireEvent.click(screen.getByRole('button', { name: t('silence.stop') }));
    expect(screen.getAllByText(t('silence.ended')).length).toBeGreaterThan(0);
    expect(clearSpy).toHaveBeenCalledWith(timerId);
  });

  it('clears the timeout on unmount', () => {
    const setSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = render(<SilenceMoment seconds={60} prompt={PROMPT} />);
    fireEvent.click(screen.getByTestId('silence-start'));
    const idx = setSpy.mock.calls.findIndex((call) => call[1] === 60_000);
    expect(idx).toBeGreaterThanOrEqual(0);
    const timerId = setSpy.mock.results[idx]?.value as unknown;
    unmount();
    expect(clearSpy).toHaveBeenCalledWith(timerId);
  });

  it('announces only start and end in a polite status region', () => {
    render(<SilenceMoment seconds={60} prompt={PROMPT} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('');
    fireEvent.click(screen.getByTestId('silence-start'));
    expect(status).toHaveTextContent(t('silence.title'));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(status).toHaveTextContent(t('silence.ended'));
  });
});
