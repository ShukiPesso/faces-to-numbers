import type { ReactNode } from 'react';

export interface NightBandProps {
  /** Short label above the title (e.g. "תחנה 1 מתוך 7"). */
  eyebrow?: ReactNode;
  /** The page's single h1. */
  title: string;
  subtitle?: ReactNode;
  /** Optional extra line under the subtitle (duration, kind). */
  children?: ReactNode;
  /** Centered layout with a larger mark (home page). */
  centered?: boolean;
}

/**
 * Page header in the dark (design system "מאפר לכלנית"): `night` ground, the night anemone, eyebrow,
 * title and subtitle. Full-bleed below md, a rounded band from md up. Short text only.
 */
export function NightBand({ eyebrow, title, subtitle, children, centered = false }: NightBandProps) {
  return (
    <div
      data-night=""
      data-testid="night-band"
      className={[
        '-mx-4 -mt-6 mb-7 bg-night px-4 pb-7 pt-8 text-on-night md:mx-0 md:mt-0 md:rounded-lg md:px-7',
        centered ? 'text-center' : '',
      ].join(' ')}
    >
      <img
        src="./icons/mark-night.svg"
        alt=""
        aria-hidden="true"
        width={centered ? 56 : 36}
        height={centered ? 56 : 36}
        className={centered ? 'mx-auto mb-5 size-[3.5rem]' : 'mb-4 size-[2.25rem]'}
      />
      {eyebrow ? (
        <p className="mb-2 font-body text-sm font-semibold text-accent-on-night">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-3xl font-display-bold text-on-night">{title}</h1>
      {subtitle ? (
        <p
          className={[
            'mt-2 max-w-measure font-body text-base text-on-night-muted',
            centered ? 'mx-auto' : '',
          ].join(' ')}
        >
          {subtitle}
        </p>
      ) : null}
      {children ? <div className="mt-3 text-sm text-on-night-muted">{children}</div> : null}
    </div>
  );
}
