import { useEffect } from 'react';

import { clearCache } from 'shared/lib/utils';
import ver from '../../pwa-ver.txt?raw';

export const useCheckVersion = () => {
    useEffect(() => {
        if (import.meta.env.DEV) return;

        const checkVer = () => {
            const hash = Date.now();
            fetch(`${import.meta.env.BASE_URL}pwa-ver.txt?h=${hash}`)
                .then((r) => r.text())
                .then((remote) => {
                    if (remote.trim() && remote !== ver) {
                        alert('Доступно обновление, приложение перезагрузится');
                        clearCache(); // почистит sw‑кэш и перезагрузит
                    }
                })
                .catch(console.error);
        };

        if (navigator.onLine) checkVer();
        window.addEventListener('online', checkVer);
        return () => window.removeEventListener('online', checkVer);
    }, []);
};
