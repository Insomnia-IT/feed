import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';

import type { ApiHook } from 'request/lib';
import type { Volunteer } from 'db';
import { db } from 'db';

interface ServerVolunteer extends Omit<Volunteer, 'qr'> {
    qr: string | null;
}

export const useGetVols = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
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
                    .get<{ results: Array<ServerVolunteer> }>(`${baseUrl}/volunteers/`, {
                        headers: {
                            Authorization: `K-PIN-CODE ${pin}`
                        },
                        params: {
                            ...filters
                        }
                    })
                    .then(async ({ data: { results } }) => {
                        setFetching(false);

                        const volunteers = results.filter(
                            (volunteer): volunteer is ServerVolunteer & { qr: string } => {
                                return Boolean(volunteer.qr);
                            }
                        );

                        const skippedVolunteerIds = results.filter(({ qr }) => !qr).map(({ id }) => id);

                        try {
                            await db.volunteers.bulkDelete(skippedVolunteerIds);
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
