import { useEffect } from 'react';
import { t } from '@/lib/i18n';

/** Sets `document.title` to `<title> · <app name>` (Architecture §4), or just the app name on the home page. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    // The home page title is the app name itself; never repeat it as a suffix.
    document.title = title === t('app.name') ? title : `${title}${t('app.titleSuffix')}`;
  }, [title]);
}
