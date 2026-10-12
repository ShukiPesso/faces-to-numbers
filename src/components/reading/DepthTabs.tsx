import { useRef, type KeyboardEvent } from 'react';
import type { Depth } from '@/content/schema';
import { t } from '@/lib/i18n';

export interface DepthTabsProps {
  value: Depth;
  onChange: (depth: Depth) => void;
}

const TABS: ReadonlyArray<{ key: Depth; label: 'depth.s30' | 'depth.m2' | 'depth.m5' }> = [
  { key: 's30', label: 'depth.s30' },
  { key: 'm2', label: 'depth.m2' },
  { key: 'm5', label: 'depth.m5' },
];

/** Reading-depth tablist. In RTL, ArrowLeft moves to the next tab and ArrowRight to the previous. */
export function DepthTabs({ value, onChange }: DepthTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (index: number) => {
    const tab = TABS[index];
    if (tab === undefined) return;
    refs.current[index]?.focus();
    if (tab.key !== value) onChange(tab.key);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let target: number | null = null;
    if (event.key === 'ArrowLeft') target = Math.min(index + 1, TABS.length - 1);
    else if (event.key === 'ArrowRight') target = Math.max(index - 1, 0);
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = TABS.length - 1;
    if (target === null) return;
    event.preventDefault();
    select(target);
  };

  return (
    <div className="my-5 md:max-w-measure">
      <p id="depth-label" className="mb-2 font-body text-sm font-semibold leading-sm text-ink">
        {t('depth.label')}
      </p>
      <div
        role="tablist"
        aria-label={t('depth.label')}
        data-testid="depth-tabs"
        className="grid grid-cols-3 rounded-md border-hairline border-primary"
      >
        {TABS.map((tab, index) => {
          const selected = tab.key === value;
          return (
            <button
              key={tab.key}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`depth-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls="depth-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={[
                'min-h-[var(--tap-min)] px-3 text-center font-body text-base leading-sm',
                '[[data-read-aloud=true]_&]:min-h-[var(--space-9)]',
                index > 0 ? 'border-s-hairline border-primary' : 'rounded-s-md',
                index === TABS.length - 1 ? 'rounded-e-md' : '',
                selected
                  ? 'border-b-4 border-b-primary-ink bg-primary font-semibold text-primary-ink'
                  : 'bg-surface font-normal text-primary hover:underline',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {t(tab.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
