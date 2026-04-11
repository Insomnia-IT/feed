import axios, { type AxiosResponse } from 'axios';
import { useCallback } from 'react';

type AuthUserResponse = { id: number };

export const useCheckAuth = (
    baseUrl: string,
    setAuth: (auth: boolean) => void
): ((pin: string) => Promise<AxiosResponse<AuthUserResponse>>) =>
    useCallback(
        (pin: string) =>
            axios
                .get<AuthUserResponse>(`${baseUrl}/auth/user/`, {
                    headers: {
                        Authorization: `K-PIN-CODE ${pin}`
                    }
                })
                .then((e) => {
                    return e;
                })
                .catch((e: unknown) => {
                    if (axios.isAxiosError(e) && e.response && e.response.status === 401) {
                        setAuth(false);
                    }
                    throw e;
                }),
        [baseUrl, setAuth]
    );
