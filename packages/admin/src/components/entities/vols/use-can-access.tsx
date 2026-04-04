import { useEffect, useState } from 'react';
import { ACL } from 'acl';

const useCanAccess = ({ action, resource }: { action: string; resource: string }): boolean => {
    const [canAccess, setCanAccess] = useState(false);

    useEffect(() => {
        let alive = true;

        (async () => {
            const { can } = await ACL.can({ action, resource });
            if (alive) setCanAccess(can);
        })();

        return () => {
            alive = false;
        };
    }, [action, resource]);

    return canAccess;
};

export default useCanAccess;
