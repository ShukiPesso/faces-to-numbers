import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentWarningGate } from '@/components/reading/ContentWarningGate';
import { t } from '@/lib/i18n';
import { isGateOpened } from '@/lib/storage';

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});

function renderGate(sensitivity: 'standard' | 'graphic', personId = 'test-person-1') {
  return render(
    <div>
      <ContentWarningGate personId={personId} sensitivity={sensitivity}>
        <p>תוכן בדיקה</p>
      </ContentWarningGate>
      <button type="button">אחרי השער</button>
    </div>,
  );
}

describe('CT-GATE-01 ContentWarningGate', () => {
  it('standard renders children and no gate', () => {
    renderGate('standard');
    expect(screen.getByText('תוכן בדיקה')).toBeInTheDocument();
    expect(screen.queryByTestId('warning-gate')).toBeNull();
  });

  it('graphic hides children (not in the DOM) behind the gate', () => {
    renderGate('graphic');
    expect(screen.getByTestId('warning-gate')).toBeInTheDocument();
    expect(screen.getByText(t('warning.title'))).toBeInTheDocument();
    expect(screen.getByText(t('warning.body'))).toBeInTheDocument();
    expect(screen.queryByText('תוכן בדיקה')).toBeNull();
  });

  it('show reveals children, remembers the choice and moves focus into the content', async () => {
    renderGate('graphic');
    await userEvent.click(screen.getByTestId('warning-show'));
    const content = screen.getByText('תוכן בדיקה');
    expect(content).toBeInTheDocument();
    expect(screen.queryByTestId('warning-gate')).toBeNull();
    expect(content.parentElement).toHaveFocus();
    expect(isGateOpened('test-person-1')).toBe(true);
  });

  it('skip keeps children hidden, offers show again and moves focus past the gate', async () => {
    renderGate('graphic');
    await userEvent.click(screen.getByTestId('warning-skip'));
    expect(screen.queryByText('תוכן בדיקה')).toBeNull();
    expect(screen.getByText(t('warning.skipped'))).toBeInTheDocument();
    expect(screen.getByTestId('warning-show')).toBeInTheDocument();
    expect(screen.queryByTestId('warning-skip')).toBeNull();
    const gate = screen.getByTestId('warning-gate');
    expect(gate.nextElementSibling).toHaveFocus();
    expect(isGateOpened('test-person-1')).toBe(false);

    await userEvent.click(screen.getByTestId('warning-show'));
    expect(screen.getByText('תוכן בדיקה')).toBeInTheDocument();
  });

  it('an already opened gate renders children immediately (remembered in session)', () => {
    const first = renderGate('graphic');
    act(() => {
      screen.getByTestId('warning-show').click();
    });
    first.unmount();
    renderGate('graphic');
    expect(screen.getByText('תוכן בדיקה')).toBeInTheDocument();
    expect(screen.queryByTestId('warning-gate')).toBeNull();
  });

  it('a different person stays gated', () => {
    sessionStorage.setItem('ftn:v1:gates', JSON.stringify(['test-person-1']));
    renderGate('graphic', 'test-person-2');
    expect(screen.getByTestId('warning-gate')).toBeInTheDocument();
  });
});
