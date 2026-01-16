import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Captura do evento de instalação para permitir o download do PWA via interface
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
});

// Registro do Service Worker de forma robusta
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // O navegador resolve caminhos relativos passados ao register() de forma nativa e segura.
    // Isso evita o erro "Failed to construct 'URL'" que ocorre quando tentamos construir manualmente
    // uma URL absoluta em ambientes onde o document.location não é uma base válida.
    const swPath = './sw.js';

    navigator.serviceWorker.register(swPath)
      .then((reg) => {
        console.log('PWA: Service Worker registrado com sucesso:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA: Registro do Service Worker falhou (provável ambiente de desenvolvimento):', err.message);
      });
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}