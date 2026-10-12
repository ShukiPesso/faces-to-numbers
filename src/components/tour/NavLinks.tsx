import { Navigation } from 'lucide-react';
import { Button } from '@/components/primitives';
import type { GeoPoint } from '@/content/schema';
import { t } from '@/lib/i18n';
import { googleMapsUrl, wazeUrl } from '@/lib/links';

export interface NavLinksProps {
  location: GeoPoint | null;
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
      </div>
    </div>
  );
}
