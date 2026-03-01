import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';

import type { ApiHook } from 'request/lib';
import type { GroupBadge } from 'db';
import { db } from 'db';

export const useGetGroupBadges = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const [error, setError] = useState<unknown>(null);
    const [updated, setUpdated] = useState<number | null>(null);
    const [fetching, setFetching] = useState<boolean>(false);

    const send = useCallback(
        (filters: Record<string, string | number | boolean>) => {
            if (fetching) {
                return Promise.resolve(false);
            }

            setFetching(true);

            return new Promise((res, rej) => {
                axios
                    .get(`${baseUrl}/group-badges/`, {
                        headers: {
                            Authorization: `K-PIN-CODE ${pin}`
                        },
                        params: filters
                    })
                    .then(async ({ data: { results } }) => {
                        setFetching(false);

                        // const qrs = {};
                        // const ids = {};
                        // for (const v of results as Array<GroupBadge>) {
                        //     if (ids[v.id]) {
                        //         console.log(ids[v.id], v);
                        //     } else {
                        //         ids[v.id] = v;
                        //     }
                        //     if (qrs[v.qr]) {
                        //         console.log(qrs[v.qr], v);
                        //     } else {
                        //         qrs[v.qr] = v;
                        //     }
                        // }

                        try {
                            await db.groupBadges.bulkPut(results as Array<GroupBadge>);
                        } catch (e) {
                            console.error(e);
                            rej(e);
                            return false;
                        }
                        setUpdated(+new Date());
                        res(true);
                        return true;
                    })
                    .catch((e: unknown) => {
                        setFetching(false);
                        if (axios.isAxiosError(e) && e.response?.status === 401) {
                            rej(false);
                            setAuth(false);
                            return false;
                        }
                        setError(e);
                        rej(e);
                        return e;
                    });
            });
        },
        [baseUrl, error, fetching, pin, setAuth]
    );

    return useMemo(
        () => ({
            fetching,
            error,
            updated,
            send
        }),
        [error, fetching, send, updated]
    ) as ApiHook;
};
