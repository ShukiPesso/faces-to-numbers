import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrefsProvider } from '@/app/PrefsProvider';
import { usePrefs } from '@/app/prefsContext';
import { DepthTabs } from '@/components/reading/DepthTabs';
import type { Depth } from '@/content/schema';
import { t } from '@/lib/i18n';
import { getDepth } from '@/lib/storage';

function Harness({ initial = 'm2' }: { initial?: Depth }) {
  const [value, setValue] = useState<Depth>(initial);
  return <DepthTabs value={value} onChange={setValue} />;
}

function Connected() {
  const { depth, setDepth } = usePrefs();
  return <DepthTabs value={depth} onChange={setDepth} />;
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(cleanup);

describe('CT-DEPTH-01 DepthTabs', () => {
  it('renders a labelled tablist with three tabs and one selected', () => {
    render(<Harness />);
    const list = screen.getByRole('tablist', { name: t('depth.label') });
    expect(list).toHaveAttribute('data-testid', 'depth-tabs');
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((x) => x.textContent)).toEqual([t('depth.s30'), t('depth.m2'), t('depth.m5')]);
    expect(tabs.map((x) => x.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    expect(tabs.map((x) => x.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
  });

  it('ArrowLeft goes to the next tab and ArrowRight to the previous (RTL), without wrapping', async () => {
    const user = userEvent.setup();
    render(<Harness initial="s30" />);
    const [s30, m2, m5] = screen.getAllByRole('tab');
    s30?.focus();
    await user.keyboard('{ArrowLeft}');
    expect(m2).toHaveAttribute('aria-selected', 'true');
    expect(m2).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(m5).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(m5).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(m2).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(s30).toHaveAttribute('aria-selected', 'true');
    expect(s30).toHaveFocus();
  });

  it('Home selects the first and End the last tab', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    screen.getByRole('tab', { name: t('depth.m2') }).focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: t('depth.m5') })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: t('depth.s30') })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('click selects, calls onChange, and does not scroll or navigate', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(<DepthTabs value="m2" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: t('depth.m5') }));
    expect(onChange).toHaveBeenCalledWith('m5');
    expect(scroll).not.toHaveBeenCalled();
    scroll.mockRestore();
  });

  it('persists the selection via setDepth', async () => {
    const user = userEvent.setup();
    render(
      <PrefsProvider>
        <Connected />
      </PrefsProvider>,
    );
    await user.click(screen.getByRole('tab', { name: t('depth.s30') }));
    expect(getDepth()).toBe('s30');
  });
});
