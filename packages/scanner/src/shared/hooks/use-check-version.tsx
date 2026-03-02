import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const useCheckVersion = () => {
    useEffect(() => {
        if (import.meta.env.DEV) return;

        const updateSW = registerSW({
            immediate: true,
            onNeedRefresh() {
                if (window.confirm('Доступно обновление, приложение перезагрузится')) {
                    void updateSW?.(true);
                }
            }
        });
    }, []);
};
