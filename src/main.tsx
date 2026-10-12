import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { PrefsProvider } from './app/PrefsProvider';
import { createAppRouter } from './app/router';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

const router = createAppRouter();

createRoot(rootElement).render(
  <StrictMode>
    <PrefsProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </PrefsProvider>
  </StrictMode>,
);
