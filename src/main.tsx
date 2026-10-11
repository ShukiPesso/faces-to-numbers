import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <main id="main">
      <h1>פנים למספרים</h1>
    </main>
  </StrictMode>,
);
