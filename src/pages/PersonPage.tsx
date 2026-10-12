import { useParams } from 'react-router-dom';
import { getPersonById } from '@/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { NotFoundPage } from './NotFoundPage';
import { PageTitle } from './PageTitle';

/** Person page (/person/:id) — stub; F-16 replaces it. Unknown id → NotFoundPage. */
export function PersonPage() {
  const { id = '' } = useParams();
  const person = getPersonById(id);
  useDocumentTitle(person ? person.name : t('notFound.title'));
  return person ? <PageTitle>{person.name}</PageTitle> : <NotFoundPage />;
}
