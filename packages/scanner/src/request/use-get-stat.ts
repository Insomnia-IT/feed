import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';

import type { StatisticItem } from 'db';

export const useGetStat = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void) => {
    const [error, setError] = useState<unknown>(null);
    const [fetching, setFetching] = useState<boolean>(false);

    const send = useCallback(
        (date: string) => {
            setFetching(true);

            return new Promise<StatisticItem[]>((res, rej) => {
                axios
                    .get<Array<StatisticItem>>(`${baseUrl}/statistics/`, {
                        headers: {
                            Authorization: `K-PIN-CODE ${pin}`
                        },
                        params: {
                            date_from: date,
                            date_to: date,
                            prediction_alg: 3,
                            apply_predict_alg_to_group_badge: true
                        }
                    })
                    .then(async ({ data }) => {
                        setFetching(false);

                        res(data);

                        return true;
                    })
                    .catch((error: unknown) => {
                        setFetching(false);

                        if (axios.isAxiosError(error) && error.response?.status === 401) {
                            rej(false);
                            setAuth(false);

                            return false;
                        }

                        setError(error);
                        rej(error);

                        return error;
                    });
            });
        },
        [baseUrl, pin, setAuth]
    );

    return useMemo(
        () => ({
            fetching,
            error,
            send
        }),
        [error, send, fetching]
    );
};
