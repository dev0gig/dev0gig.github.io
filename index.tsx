
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Cookie explizit auf Root-Pfad setzen
document.cookie = "pwa_session=root_app; path=/; max-age=31536000; SameSite=Strict; Secure";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
