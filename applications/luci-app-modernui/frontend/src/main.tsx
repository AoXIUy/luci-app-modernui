import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

const rootEl = document.getElementById('modernui-root');
if (!rootEl) throw new Error('Root element #modernui-root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
