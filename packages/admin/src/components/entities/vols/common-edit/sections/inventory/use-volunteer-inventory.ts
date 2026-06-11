import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notification } from 'antd';

import { getVolunteerInventory } from './api';

export const useVolunteerInventory = (volunteerId?: number) => {
    const query = useQuery({
        queryKey: ['volunteer-inventory', volunteerId],
        queryFn: () => getVolunteerInventory(volunteerId!),
        enabled: !!volunteerId
    });

    useEffect(() => {
        if (!query.isError) return;

        console.error(query.error);
        notification.error({ message: 'Не удалось загрузить инвентарь' });
    }, [query.error, query.isError]);

    return {
        inventory: query.data ?? [],
        isLoading: query.isLoading || query.isFetching,
        reload: query.refetch
    };
};
