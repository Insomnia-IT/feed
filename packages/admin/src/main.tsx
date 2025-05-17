import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import sas from 'onscan.js';

import App from './app';

import './index.css';
import { isBrowser } from 'utils';

if (isBrowser) {
    sas.attachTo(document, {
        suffixKeyCodes: [13], // enter-key expected at the end of a scan
        reactToPaste: false,
        minLength: 8,
        captureEvents: true,
        keyCodeMapper: (e: KeyboardEvent) => String.fromCharCode(e.keyCode).toLowerCase()
    });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
