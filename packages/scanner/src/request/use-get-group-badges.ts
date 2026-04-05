import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';

import type { ApiHook } from '~/request/lib';
import type { GroupBadge } from '~/db';
import { db } from '~/db';

export const useGetGroupBadges = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const send = useCallback(
        (filters) => {
            if (fetching) {
                return Promise.resolve(false);
            }

            setFetching(true);

            return new Promise((res, rej) => {
                axios
                    .get<{ results: Array<GroupBadge> }>(`${baseUrl}/group-badges/`, {
                        headers: {
                            Authorization: `K-PIN-CODE ${pin}`
                        },
                        params: filters
                    })
                    .then(async ({ data: { results } }) => {
                        setFetching(false);

                        try {
                            await db.groupBadges.bulkPut(results);
                        } catch (error) {
                            console.error(error);
                            rej(error);

                            return false;
                        }

                        setUpdated(+new Date());
                        res(true);

                        return true;
                    })
                    .catch((error) => {
                        setFetching(false);

                        if (error?.response?.status === 401) {
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
        [baseUrl, error, fetching, pin, setAuth]
    );

    return <ApiHook>useMemo(
        () => ({
            fetching,
            error,
            updated,
            send
        }),
        [error, fetching, send, updated]
    );
};
