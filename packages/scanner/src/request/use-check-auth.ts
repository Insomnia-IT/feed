import axios from 'axios';
import { useCallback } from 'react';

export const useCheckAuth = (baseUrl: string, setAuth: (auth: boolean) => void): ((pin: string) => Promise<any>) =>
    useCallback(
        (pin: string) =>
            axios
                .get(`${baseUrl}/auth/user/`, {
                    headers: {
                        Authorization: `K-PIN-CODE ${pin}`
                    }
                })
                .then((e) => {
                    return e;
                })
                .catch((e) => {
                    if (e.response && e.response.status === 401) {
                        setAuth(false);
                    }
                    throw e;
                }),
        [baseUrl, setAuth]
    );
