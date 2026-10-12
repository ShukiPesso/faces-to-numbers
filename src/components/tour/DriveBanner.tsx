import { Car } from 'lucide-react';
import { t } from '@/lib/i18n';

export function DriveBanner() {
  return (
    <div
      role="note"
      data-testid="driver-warning"
      className="mb-6 flex items-center gap-3 rounded-e-md border-s-accent-line border-accent bg-warning-bg px-5 py-4"
    >
      <Car className="size-icon-md shrink-0 text-accent" aria-hidden="true" focusable="false" />
      <p className="font-body text-lg font-semibold text-ink md:text-lg">{t('drive.warning')}</p>
    </div>
  );
}
