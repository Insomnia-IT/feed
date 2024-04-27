import { useEffect } from 'react';
import axios from 'axios/index';

import { clearCache } from '~/shared/lib/utils';

// eslint-disable-next-line import/no-unresolved
import ver from '!!raw-loader!pwa-ver.txt';

console.log(`local app ver: ${ver}`);

export const useCheckVersion = () => {
    useEffect(() => {
        const checkVer = (): void => {
            console.log('online, check ver..');
            const hash = new Date().toISOString();
            void axios.get(`public/pwa-ver.txt?h=${hash}`).then(({ data }: any): void => {
                console.log(`remote app ver: ${data}`);
                if (data !== ver) {
                    console.log('new version, reloading...');
                    alert('Доступно обновление, приложение перезагрузится');
                    clearCache();
                }
            });
        };

        if (navigator.onLine) {
            checkVer();
        }

        window.addEventListener('online', checkVer);

        return () => {
            window.removeEventListener('online', checkVer);
        };
    }, []);
};
