import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './styles/global.css';
import App from './App.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { installAuthRefresh } from './services/authRefresh.js';

// Renovación automática de sesión ante 401 (ADR-0019).
installAuthRefresh();

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={new QueryClient()}>
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  </QueryClientProvider>
);
