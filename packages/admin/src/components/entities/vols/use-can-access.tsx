import { useEffect, useState } from 'react';

import { ACL } from '~/acl';

const useCanAccess = ({ action, resource }: { action: string; resource: string }): boolean => {
    const [canAccess, setCanAccess] = useState(false);

    const loadCanAccess = async () => {
        debugger;
        const { can } = await ACL.can({ action, resource });
        setCanAccess(can);
    };

    useEffect(() => {
        void loadCanAccess();
    }, []);

    return canAccess;
};

export default useCanAccess;
