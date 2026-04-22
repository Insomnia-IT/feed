import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';

import type { ApiHook } from 'request/lib';
import type { GroupBadge } from 'db';
import { db } from 'db';

interface ServerGroupBadge extends Omit<GroupBadge, 'qr'> {
    qr: string | null;
    deleted_at?: string | null;
}

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
                    .get<{ results: Array<ServerGroupBadge> }>(`${baseUrl}/group-badges/`, {
                        headers: {
                            Authorization: `K-PIN-CODE ${pin}`
                        },
                        params: filters
                    })
                    .then(async ({ data: { results } }) => {
                        setFetching(false);

                        const groupBadges = results
                            .filter((badge): badge is ServerGroupBadge & { qr: string } => {
                                return Boolean(badge.qr) && !badge.deleted_at;
                            })
                            .map<GroupBadge>(({ qr, ...badge }) => ({
                                ...badge,
                                qr
                            }));

                        try {
                            await db.groupBadges.bulkPut(groupBadges);
                        } catch (error) {
                            console.error(error);
                            rej(error);

                            return false;
                        }

                        setUpdated(+new Date());
                        res(true);

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
