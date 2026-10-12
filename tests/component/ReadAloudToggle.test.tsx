import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PrefsProvider } from '@/app/PrefsProvider';
import { ReadAloudToggle } from '@/components/reading/ReadAloudToggle';
import { t } from '@/lib/i18n';
import { getReadAloud, setReadAloud } from '@/lib/storage';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.readAloud;
});

describe('CT-RA-01 ReadAloudToggle', () => {
  it('toggles aria-pressed, persists, and sets data-read-aloud on <html>', async () => {
    const user = userEvent.setup();
    render(
      <PrefsProvider>
        <ReadAloudToggle />
      </PrefsProvider>,
    );
    const button = screen.getByTestId('read-aloud-toggle');
    expect(button).toHaveAccessibleName(t('readAloud.label'));
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.dataset.readAloud).toBeUndefined();

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAccessibleName(t('readAloud.label'));
    expect(document.documentElement.dataset.readAloud).toBe('true');
    expect(getReadAloud()).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent(t('readAloud.on'));

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.dataset.readAloud).toBeUndefined();
    expect(getReadAloud()).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent(t('readAloud.off'));
  });

  it('starts pressed when the preference was stored', () => {
    setReadAloud(true);
    render(
      <PrefsProvider>
        <ReadAloudToggle />
      </PrefsProvider>,
    );
    expect(screen.getByTestId('read-aloud-toggle')).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.readAloud).toBe('true');
  });
});
