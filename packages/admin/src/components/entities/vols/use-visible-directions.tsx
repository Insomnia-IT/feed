import { useEffect, useState } from 'react';

import type { UserData } from 'auth';
import { getUserData } from 'auth';

import useCanAccess from './use-can-access';

const useVisibleDirections = (): Array<string> | undefined => {
    const canFullList = useCanAccess({
        action: 'full_list',
        resource: 'volunteers'
    });

    const [authorizedUserData, setAuthorizedUserData] = useState<UserData | null>(null);

    useEffect(() => {
        if (canFullList || authorizedUserData) return;

        let cancelled = false;

        getUserData(true).then((user) => {
            if (!cancelled) setAuthorizedUserData(user);
        });

        return () => {
            cancelled = true;
        };
    }, [canFullList, authorizedUserData]);

    return canFullList ? undefined : (authorizedUserData?.directions ?? []);
};

export default useVisibleDirections;
