import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTour } from '@/content';
import { t } from '@/lib/i18n';

const DATE_MARK = '\u0000';

/** Quiet end of every page: links to sources and about, and the last content review date. */
export function Footer() {
  const date = getTour().lastContentReview;
  // Split the sentence around the date so the date itself can be isolated in <bdi>.
  const [before = '', after = ''] = t('about.lastReview', { date: DATE_MARK }).split(DATE_MARK);
  const linkClass =
    'inline-flex min-h-[var(--tap-min)] min-w-[var(--tap-min)] items-center justify-center gap-2 font-semibold text-primary no-underline hover:underline';

  return (
    <footer className="border-t-hairline border-border bg-bg px-4 py-7 md:px-7">
      <div className="mx-auto max-w-content">
        <ul className="flex flex-wrap gap-4">
          <li>
            <Link to="/sources" className={linkClass}>
              <BookOpen
                aria-hidden="true"
                focusable="false"
                strokeWidth={1.75}
                className="size-icon-sm"
              />
              {t('nav.sources')}
            </Link>
          </li>
          <li>
            <Link to="/about" className={linkClass}>
              {t('nav.about')}
            </Link>
          </li>
        </ul>
        <p className="mt-3 text-xs text-ink-muted">
          {before}
          <bdi>{date}</bdi>
          {after}
        </p>
      </div>
    </footer>
  );
}
