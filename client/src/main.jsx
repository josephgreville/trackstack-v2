import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { initNative } from './native/capacitor.js';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/mobile.css';
import './styles/native.css';

// Prepare the native shell before the first render so the status bar and
// keyboard are already correct when the app appears.
initNative();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
