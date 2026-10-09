import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/app.css';
import { App } from './ui/App';
import { unlockSpeech } from './core/speech';
import { caps } from './core/caps';
import { speechStatus } from './core/listen';

unlockSpeech();
// Mluvení na školním ostrově: zapne se, jen když ho server umí.
void speechStatus().then((ok) => {
  caps.speech = ok;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
