import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const useCheckVersion = () => {
    useEffect(() => {
        if (import.meta.env.DEV) return;

        let isReloading = false;
        let swRegistration: ServiceWorkerRegistration | undefined;
        const updateSW = registerSW({
            immediate: true,
            onNeedRefresh() {
                void updateSW?.(true);
            },
            onRegisteredSW(_swUrl, registration) {
                if (!registration) return;

                swRegistration = registration;
                void registration.update();
            }
        });

        const checkVersion = () => {
            if (!navigator.onLine || !swRegistration) return;

            void swRegistration.update();
        };

        const reloadPage = () => {
            if (isReloading) return;
            isReloading = true;
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', reloadPage);
        window.addEventListener('online', checkVersion);

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', reloadPage);
            window.removeEventListener('online', checkVersion);
        };
    }, []);
};
