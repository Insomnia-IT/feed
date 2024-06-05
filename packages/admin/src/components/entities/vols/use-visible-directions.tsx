import { useEffect, useState } from 'react';

import { UserData, getUserData } from '~/auth';
import useCanAccess from './use-can-access';

const useVisibleDirections = (): string[] | undefined => {
    const canFullList = useCanAccess({ action: 'full_list', resource: 'volunteers' });

    const [authorizedUserData, setAuthorizedUserData] = useState<UserData | null>(null);

    const loadAuthorizedUserData = async () => {
        const user = await getUserData(null, true);
        setAuthorizedUserData(user);
    };

    useEffect(() => {
        if (!canFullList && !authorizedUserData) {
            void loadAuthorizedUserData();
        }
    }, [canFullList, authorizedUserData]);

    return canFullList ? undefined : authorizedUserData?.directions ?? [];
};

export default useVisibleDirections;
