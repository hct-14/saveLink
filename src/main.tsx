import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safeguard against browser extensions trying to overwrite window.fetch
try {
  const originalFetch = window.fetch;
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    writable: true,
    value: originalFetch,
  });
} catch {
  // ignore if window.fetch is locked by browser security
}

// Suppress unhandled extension errors from surfacing
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('chrome-extension://')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);
