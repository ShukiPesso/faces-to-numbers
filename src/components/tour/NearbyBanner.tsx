import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/primitives';
import type { NearbyState } from '@/hooks/useNearbyStation';
import { formatDistance } from '@/lib/format';
import { t } from '@/lib/i18n';
import { stationPath } from '@/lib/links';

export interface NearbyBannerProps {
  state: NearbyState;
  onLocate: () => void;
}

function Title({ children }: { children: string }) {
  return <bdi className="font-semibold">{children}</bdi>;
}

/** Splits a template at its {title}/{distance} placeholders so those parts can be wrapped. */
function renderMessage(key: 'nearby.at' | 'nearby.near', title: string, distance?: string) {
  const marker = '\u0000';
  const text = t(key, { title: marker + 'T' + marker, distance: marker + 'D' + marker });
  return text.split(marker).map((part, i) => {
    if (part === 'T') return <Title key={i}>{title}</Title>;
    if (part === 'D') return <bdi key={i}>{distance}</bdi>;
    return part;
  });
}

export function NearbyBanner({ state, onLocate }: NearbyBannerProps) {
  const locating = state.status === 'locating';
  let message: React.ReactNode = null;
  let link: { slug: string; variant: 'primary' | 'secondary' } | null = null;

  switch (state.status) {
    case 'locating':
      message = t('nearby.locating');
      break;
    case 'denied':
      message = t('nearby.denied');
      break;
    case 'unavailable':
      message = t('nearby.unavailable');
      break;
    case 'done': {
      const r = state.result;
      if (r.kind === 'at') {
        message = renderMessage('nearby.at', r.station.title);
        link = { slug: r.station.slug, variant: 'primary' };
      } else if (r.kind === 'near') {
        message = renderMessage('nearby.near', r.station.title, formatDistance(r.distanceM));
        link = { slug: r.station.slug, variant: 'secondary' };
      } else {
        message = t('nearby.none');
      }
      break;
    }
    default:
      break;
  }

  return (
    <div className="rounded-lg border-hairline border-border bg-surface p-5 font-body shadow-card">
      <Button
        variant="secondary"
        icon={LocateFixed}
        busy={locating}
        fullWidth
        onClick={onLocate}
        data-testid="where-am-i"
      >
        {t('nearby.button')}
      </Button>
      <p className="mt-2 text-xs text-ink-muted">{t('nearby.privacy')}</p>
      <div
        role="status"
        aria-live="polite"
        data-testid="nearby-banner"
        className="mt-3 min-h-[1lh] text-base text-ink"
      >
        {message}
        {link ? (
          <div className="mt-3">
            <Button variant={link.variant} href={`#${stationPath(link.slug)}`}>
              {t('nearby.open')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
