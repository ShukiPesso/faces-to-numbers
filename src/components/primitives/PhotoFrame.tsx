import { useState } from 'react';
import type { Photo } from '@/content/schema';
import { t } from '@/lib/i18n';

export interface PhotoFrameProps {
  photo: Photo;
  name: string;
}

const BOX = 'aspect-[4/3] w-full rounded-lg';
const PLACEHOLDER = `${BOX} flex items-center justify-center border-hairline border-border bg-bg p-5 text-center font-body text-sm text-ink-muted`;
const OUTER = 'my-6 md:my-7 md:max-w-[calc(var(--content-max)/2)]';

export function PhotoFrame({ photo, name }: PhotoFrameProps) {
  const [failed, setFailed] = useState(false);

  if (photo.status !== 'cleared') {
    return (
      <div className={OUTER}>
        <div className={PLACEHOLDER} data-testid="photo-placeholder">
          {t('photo.pending')}
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className={OUTER}>
        <div className={PLACEHOLDER} data-testid="photo-placeholder">
          {photo.alt}
        </div>
      </div>
    );
  }

  return (
    <figure className={OUTER} aria-label={photo.alt === '' ? name : undefined}>
      <img
        className={`${BOX} object-cover`}
        src={photo.src}
        alt={photo.alt}
        width={800}
        height={600}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
      <figcaption className="mt-2 font-body text-xs text-ink-muted">
        {t('photo.credit', { credit: photo.credit })}
      </figcaption>
    </figure>
  );
}
