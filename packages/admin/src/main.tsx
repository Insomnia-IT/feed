import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import sas from 'onscan.js';

import App from './app';

import './index.css';
import { isBrowser } from 'utils';

type OnScanApi = {
    attachTo: (target: Document, options: object) => void;
    detachFrom?: (target: Document) => void;
};

const safeDetachOnScan = (api: OnScanApi) => {
    try {
        api.detachFrom?.(document);
    } catch {
        // onscan.js throws if detachFrom is called before the first attach
    }
};

if (isBrowser) {
    const onScanApi = sas as unknown as OnScanApi;

    safeDetachOnScan(onScanApi);
    onScanApi.attachTo(document, {
        suffixKeyCodes: [13], // enter-key expected at the end of a scan
        reactToPaste: false,
        minLength: 8,
        captureEvents: true,
        keyCodeMapper: (e: KeyboardEvent) => String.fromCharCode(e.keyCode).toLowerCase()
    });

    import.meta.hot?.dispose(() => {
        safeDetachOnScan(onScanApi);
    });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
