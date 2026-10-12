import type { Quote } from '@/content/schema';
import { t } from '@/lib/i18n';

export interface QuoteBlockProps {
  quote: Quote;
  showLabel?: boolean;
}

export function QuoteBlock({ quote, showLabel = true }: QuoteBlockProps) {
  return (
    <figure className="my-7 max-w-measure border-s-accent-line border-gold ps-5">
      {showLabel ? (
        <p className="mb-2 font-body text-xs font-semibold text-gold">{t('person.quote')}</p>
      ) : null}
      <blockquote className="font-display font-display text-lg text-ink">
        {`„${quote.text}”`}
      </blockquote>
      <figcaption className="mt-3 font-body text-sm font-regular text-ink-muted">
        {`— ${quote.by}`}
      </figcaption>
    </figure>
  );
}
