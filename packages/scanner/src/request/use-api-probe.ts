import { useEffect, useState } from 'react';
import axios from 'axios';

import { API_DOMAIN } from 'config';

export type ApiProbeState = 'browser_offline' | 'api_unavailable' | 'api_available' | 'unknown';

export const probeApi = async (): Promise<ApiProbeState> => {
    if (!navigator.onLine) return 'browser_offline';
    try {
        await axios.get(`${API_DOMAIN}/health/live`, { timeout: 3000 });
        return 'api_available';
    } catch {
        return 'api_unavailable';
    }
};

export const useApiProbe = (): ApiProbeState => {
    const [state, setState] = useState<ApiProbeState>('unknown');

    useEffect(() => {
        let active = true;
        const probe = async (): Promise<void> => {
            const result = await probeApi();
            if (active) setState(result);
        };
        const online = (): void => {
            void probe();
        };
        const offline = (): void => setState('browser_offline');
        void probe();
        const interval = window.setInterval(() => void probe(), 30_000);
        window.addEventListener('online', online);
        window.addEventListener('offline', offline);
        return () => {
            active = false;
            window.clearInterval(interval);
            window.removeEventListener('online', online);
            window.removeEventListener('offline', offline);
        };
    }, []);

    return state;
};
