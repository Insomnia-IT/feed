import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';

import type { ApiHook } from '~/request/lib';
import type { Volunteer } from '~/db';
import { db } from '~/db';

export const useGetVols = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const send = useCallback(() => {
        if (fetching) {
            return Promise.resolve(false);
        }

        setFetching(true);

        return new Promise((res, rej) => {
            axios
                .get(`${baseUrl}/volunteers/?limit=10000`, {
                    headers: {
                        Authorization: `K-PIN-CODE ${pin}`
                    }
                })
                .then(async ({ data: { results } }) => {
                    setFetching(false);

                    try {
                        await db.volunteers.clear();
                    } catch (e) {
                        rej(e);
                        return false;
                    }

                    const qrs = {};
                    const ids = {};
                    for (const v of results as Array<Volunteer>) {
                        if (ids[v.id]) {
                            console.log(ids[v.id], v);
                        } else {
                            ids[v.id] = v;
                        }
                        if (qrs[v.qr]) {
                            console.log(qrs[v.qr], v);
                        } else {
                            qrs[v.qr] = v;
                        }
                    }

                    results.forEach((vol, index) => {
                        if (!vol.qr) {
                            vol.qr = `empty${index}`;
                        }
                    });

                    try {
                        await db.volunteers.bulkAdd(results as Array<Volunteer>);
                    } catch (e) {
                        console.error(e);
                        rej(e);
                        return false;
                    }
                    setUpdated(+new Date());
                    res(true);
                    return true;
                })
                .catch((e) => {
                    setFetching(false);
                    if (e?.response?.status === 401) {
                        rej(false);
                        setAuth(false);
                        return false;
                    }
                    setError(e);
                    rej(e);
                    return e;
                });
        });
    }, [baseUrl, error, fetching, pin, setAuth]);

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
