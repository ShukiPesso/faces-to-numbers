import { useEffect } from 'react';
import { t } from '@/lib/i18n';

/** Sets `document.title` to `<title> · <app name>` (Architecture §4). */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title}${t('app.titleSuffix')}`;
  }, [title]);
}
