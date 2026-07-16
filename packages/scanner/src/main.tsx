import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/app';
import { initializeDiagnostics } from './diagnostics';
import { prepareDatabase } from './db';

import './index.css';

void prepareDatabase().then(() => {
    initializeDiagnostics();
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
});
