import { ExternalLink } from 'lucide-react';
import type { Source } from '@/content/schema';
import { t } from '@/lib/i18n';

export interface SourceListProps {
  sources: Source[];
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) return null;
  return (
    <ul className="flex max-w-measure list-none flex-col gap-2 p-0">
      {sources.map((source) => (
        <li key={source.url}>
          <a
            className="block min-h-[var(--tap-min)] rounded-sm px-2 py-2 hover:bg-bg"
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="flex items-center gap-2 font-body text-base font-semibold text-primary underline">
              <span>{source.title}</span>
              <ExternalLink
                className="size-icon-sm shrink-0 rtl:scale-x-[-1]"
                aria-hidden="true"
                focusable="false"
              />
              <span className="sr-only">{t('common.externalLink')}</span>
            </span>
            <span className="block text-xs text-ink-muted [overflow-wrap:anywhere]">
              <bdi dir="ltr">{hostOf(source.url)}</bdi>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
