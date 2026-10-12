import { createHashRouter, type RouteObject } from 'react-router-dom';
import { AboutPage } from '@/pages/AboutPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PersonPage } from '@/pages/PersonPage';
import { SourcesPage } from '@/pages/SourcesPage';
import { StationPage } from '@/pages/StationPage';
import { TourPage } from '@/pages/TourPage';
import { AppLayout } from './AppLayout';
import { ErrorBoundary } from './ErrorBoundary';

/** Route table (Architecture §4). Exported so tests can mount it with createMemoryRouter. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tour', element: <TourPage /> },
      { path: 'station/:slug', element: <StationPage /> },
      { path: 'person/:id', element: <PersonPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

/** Opt in to React Router v7 behaviour now (silences the v6 future-flag warnings). */
export const routerFutureFlags = {
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_relativeSplatPath: true,
  v7_skipActionErrorRevalidation: true,
} as const;

/** The app router: hash routing only (ADR-002). */
export function createAppRouter() {
  return createHashRouter(routes, { future: routerFutureFlags });
}
