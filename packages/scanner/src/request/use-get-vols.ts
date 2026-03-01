import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';

import type { ApiHook } from 'request/lib';
import type { Volunteer } from 'db';
import { db } from 'db';

export const useGetVols = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const send = useCallback(
        (filters: any) => {
            if (fetching) {
                return Promise.resolve(false);
            }

            setFetching(true);

            return new Promise((res, rej) => {
                axios
                    .get(`${baseUrl}/volunteers/`, {
                        headers: {
                            Authorization: `K-PIN-CODE ${pin}`
                        },
                        params: {
                            ...filters,
                            is_deleted: 'all'
                        }
                    })
                    .then(async ({ data: { results } }) => {
                        setFetching(false);
                        // const qrs = {};
                        // const ids = {};
                        // for (const v of results as Array<Volunteer>) {
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

                        const deletedVolunteerIds = (results as Array<Volunteer>)
                            .filter(({ deleted_at, qr }) => deleted_at || !qr)
                            .map(({ id }) => id);

                        const volunteers = (results as Array<Volunteer>).filter(
                            ({ deleted_at, qr }) => qr && !deleted_at
                        );

                        try {
                            await db.volunteers.bulkDelete(deletedVolunteerIds);
                            await db.volunteers.bulkPut(volunteers);
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
