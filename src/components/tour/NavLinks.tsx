import { Map, MapPin, Navigation } from 'lucide-react';
import { ACTION_TILE } from '@/components/primitives/ShareButton';
import { Button } from '@/components/primitives';
import type { GeoPoint } from '@/content/schema';
import { t } from '@/lib/i18n';
import { appleMapsUrl, googleMapsUrl, wazeUrl } from '@/lib/links';

export interface NavLinksProps {
  location: GeoPoint | null;
}

/**
 * Three compact navigation tiles for the station action row (Shuki, 2026-10-16: people first want to
 * get there, then read). Generic icons with the service name; the full label is the accessible name.
 * Renders nothing when the location is missing or unverified.
 */
export function NavTiles({ location }: NavLinksProps) {
  if (location === null || !location.verified) return null;
  const tiles = [
    {
      id: 'nav-waze',
      href: wazeUrl(location),
      icon: Navigation,
      short: 'Waze',
      label: t('station.navigateWaze'),
    },
    {
      id: 'nav-google',
      href: googleMapsUrl(location),
      icon: MapPin,
      short: 'Google Maps',
      label: t('station.navigateGoogle'),
    },
    {
      id: 'nav-apple',
      href: appleMapsUrl(location),
      icon: Map,
      short: 'Apple Maps',
      label: t('station.navigateApple'),
    },
  ];
  return (
    <>
      {tiles.map(({ id, href, icon: Icon, short, label }) => (
        <a
          key={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={id}
          aria-label={`${label} (${t('common.externalLink')})`}
          className={ACTION_TILE}
        >
          <Icon className="size-icon-md shrink-0" aria-hidden="true" focusable="false" />
          <bdi className="text-center leading-tight">{short}</bdi>
        </a>
      ))}
    </>
  );
}

export function NavLinks({ location }: NavLinksProps) {
  if (location === null || !location.verified) {
    return (
      <p data-testid="location-unverified" className="max-w-measure font-body text-base text-ink">
        {t('station.locationUnverified')}
      </p>
    );
  }
  return (
    <div role="group" aria-labelledby="nav-links-label">
      <p id="nav-links-label" className="mb-2 font-body text-sm font-semibold text-ink">
        {t('station.navigate')}
      </p>
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        <Button
          variant="secondary"
          href={wazeUrl(location)}
          external
          icon={Navigation}
          data-testid="nav-waze"
        >
          {t('station.navigateWaze')}
        </Button>
        <Button
          variant="secondary"
          href={googleMapsUrl(location)}
          external
          icon={Navigation}
          data-testid="nav-google"
        >
          {t('station.navigateGoogle')}
        </Button>
        <Button
          variant="secondary"
          href={appleMapsUrl(location)}
          external
          icon={Navigation}
          data-testid="nav-apple"
        >
          {t('station.navigateApple')}
        </Button>
      </div>
    </div>
  );
}
