import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const useCheckVersion = () => {
    useEffect(() => {
        if (import.meta.env.DEV) return;

        let isReloading = false;
        let intervalId: number | undefined;
        const updateSW = registerSW({
            immediate: true,
            onNeedRefresh() {
                void updateSW?.(true);
            },
            onRegisteredSW(_swUrl, registration) {
                if (!registration) return;

                void registration.update();
                intervalId = window.setInterval(
                    () => {
                        void registration.update();
                    },
                    5 * 60 * 1000
                );
            }
        });

        const reloadPage = () => {
            if (isReloading) return;
            isReloading = true;
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', reloadPage);

        return () => {
            if (intervalId) {
                window.clearInterval(intervalId);
            }
            navigator.serviceWorker.removeEventListener('controllerchange', reloadPage);
        };
    }, []);
};
